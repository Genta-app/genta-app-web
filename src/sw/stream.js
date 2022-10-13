//
// Copyright (c) 2022 Digital Five Pty Ltd
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

/* eslint-disable no-else-return */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-mixed-operators */
/* eslint-disable no-restricted-syntax */

import * as crypto from '../library/Crypto';
import * as pack from '../library/Pack';
import * as streamutils from '../library/StreamUtils';

// eslint-disable-next-line no-unused-vars
self.addEventListener('install', (event) => {
  // console.log("installed", event, self);
  self.skipWaiting();
});

self.addEventListener('message', (event) => {
  // eslint-disable-next-line no-use-before-define
  keyCachePut(event.source.id, event.data.file_identifier, event.data);
});

function keyCachePut(client_id, file_identifier, data) {
  if (self.key_cache === undefined) {
    self.key_cache_version = 1;
    self.key_cache = {};
  }
  if (self.key_cache[client_id] === undefined) {
    self.key_cache[client_id] = {};
  }
  self.key_cache[client_id][file_identifier] = data;
}

function keyCacheGet(client_id, file_identifier) {
  if (self.key_cache === undefined) {
    return null;
  }
  return self.key_cache[client_id][file_identifier];
}

function createStreamResponse(client_id, request, file_identifier, bucket_url, length_type) {
  const { file_key, video_index_info } = keyCacheGet(client_id, file_identifier);

  if (length_type === 's') {
    const stream = new ReadableStream({
      async start(controller) {
        const resp = await fetch(bucket_url);
        const ab = await resp.arrayBuffer();
        const encrypted_data = new Uint8Array(ab);
        const decrypted_data = crypto.symmetricDecrypt(file_key, encrypted_data);
        const contents_resppack = pack.unpackValue(decrypted_data);
        controller.enqueue(contents_resppack.file.data);
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  } else { // length_type == "l"
    const range = request.headers.get('Range');
    const { unit, start, end } = streamutils.parseRange(range);

    if (unit !== 'bytes') {
      // eslint-disable-next-line no-undef
      controller.close();
      console.error('GENTA.APP: cannot parse request range:', range);
      // eslint-disable-next-line consistent-return
      return;
    }

    const pump_state = {
      req_range_start: start,
      req_range_end: end,
      part_index: -1,
      enc_range_start: 0,
      enc_range_end: 0,
    };

    // find the first part to read
    for (const ix of video_index_info.index_list) {
      pump_state.enc_range_start = pump_state.enc_range_end + ix.index_info_size;
      pump_state.enc_range_end = pump_state.enc_range_start + ix.encrypted_part_size;

      if (ix.range_start <= pump_state.req_range_start
        && ix.range_end > pump_state.req_range_start
      ) {
        pump_state.part_index = ix.part - 1;
        break;
      }
    }

    if (pump_state.part_index === -1) {
      // eslint-disable-next-line no-undef
      controller.close();
      console.error('GENTA.APP: invalid index file or range');
      // eslint-disable-next-line consistent-return
      return;
    }

    const stream = new ReadableStream({
      start(controller) {
        function pump() {
          // NOTE: HTTP range header is inclusive
          const bucket_range = `bytes=${pump_state.enc_range_start}-${pump_state.enc_range_end - 1}`;
          // eslint-disable-next-line quote-props
          const headers = { 'Range': bucket_range };

          return fetch(bucket_url, {
            headers,
          }).then((part_resp) => {
            if (part_resp.status !== 206 && part_resp.status !== 200) {
              controller.close();
              console.error('GENTA.APP: error fetching range', range);
              return;
            }
            // eslint-disable-next-line consistent-return
            return part_resp.arrayBuffer();
          }).then((ab) => {
            const encrypted_data = new Uint8Array(ab);

            const file_part = pack.unpackValue(
              crypto.symmetricDecrypt(file_key, encrypted_data)
            );

            const ix = video_index_info.index_list[pump_state.part_index];
            const slice_start = Math.max(ix.range_start - pump_state.req_range_start, 0);
            const slice_end = (pump_state.req_range_end == null
              ? file_part.data.length
              : Math.min(
                pump_state.req_range_end - pump_state.req_range_start,
                file_part.data.length - slice_start
              ) + slice_start
            );

            const data = file_part.data.slice(slice_start, slice_end);

            controller.enqueue(data);
            pump_state.req_range_start += data.length;

            pump_state.part_index += 1;
            pump_state.enc_range_start = pump_state.enc_range_end + ix.index_info_size;
            pump_state.enc_range_end = pump_state.enc_range_start + ix.encrypted_part_size;

            const close_pump = (
              pump_state.req_range_end != null
              && pump_state.req_range_start >= pump_state.req_range_end
              || pump_state.req_range_end == null
              && pump_state.part_index === video_index_info.index_list.length
            );

            if (close_pump) {
              controller.close();
              // eslint-disable-next-line no-useless-return
              return;
            } else {
              // eslint-disable-next-line consistent-return
              return pump();
            }
          }).catch(err => console.error('GENTA.APP: bucket fetch error', err));
        }

        return pump();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
  }
}

self.addEventListener('fetch', async (event) => {
  const stream_url = streamutils.parseVideoStreamURL(self.location, event.request.url);

  try {
    if (stream_url != null) {
      event.respondWith(createStreamResponse(
        event.clientId,
        event.request,
        stream_url.file_identifier,
        stream_url.bucket_url,
        stream_url.length_type
      ));
    } else {
      // eslint-disable-next-line no-unused-vars
      event.respondWith(fetch(event.request).catch(err => new Response('Network error', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      })));
    }
  } catch (err) {
    console.error(err);
  }
});
