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

export function buildVideoStreamURL(file_identifier, file_url, is_short) {
  return `/stream/${is_short ? 's' : 'l'}/${file_identifier}/${file_url}`;
}

// format schema://host/stream/<s|l>/<file-identifier>/<bucket-url>
const stream_postfix_re = /([sl])\/(fle[0-9a-f]+)\/(.*)/;

export function parseVideoStreamURL(location, video_stream_url) {
  const stream_prefix = `${location.origin}/stream/`;
  if (!video_stream_url.startsWith(stream_prefix)) {
    return null;
  }

  const stream_postfix = video_stream_url.slice(stream_prefix.length);
  const matches = stream_postfix.match(stream_postfix_re);

  if (matches.length !== 4) {
    return null;
  }

  return {
    length_type: matches[1],
    file_identifier: matches[2],
    bucket_url: matches[3],
  };
}

// eslint-disable-next-line no-useless-escape
const bytes_range_re = /([a-z]+)=([0-9]+)\-([0-9]*)/;

export function parseRange(range_value) {
  // eslint-disable-next-line no-unused-vars
  const [everything, unit, start, end] = range_value.match(bytes_range_re);
  return {
    unit,
    start: Number(start),
    end: end.length > 0 ? Number(end) : null,
  };
}
