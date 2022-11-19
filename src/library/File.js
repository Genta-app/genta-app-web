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

/* eslint-disable import/no-cycle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-template */
/* eslint-disable quote-props */
/* eslint-disable no-await-in-loop */

import * as crypto from './Crypto';
import { assert } from './Assert';

import {
  packValue,
  packAndSymmetricEncryptValue,
  unpackValue,
  _bytes_to_array
} from './Pack';

import { httpPost, httpGetBinary, } from './Req';
import { dateToYYYYMMDD } from './Format';

import {
  apiFileCreate,
  apiFileUpdate,
  apiBucketUploadToken,
  apiLargeFileStart,
  apiLargeFileGetPartUploadURL,
  apiLargeFileFinish,
} from './Api';


export const MEDIA_TYPE_IMAGE = 1;
export const MEDIA_TYPE_VIDEO = 2;
export const MEDIA_TYPE_BINARY = 3;
export const MEDIA_TYPE_COMMENT = 4;
export const MEDIA_TYPE_VIDEO_FRAGMENTED = 5;

export const STOCK_FILE_TYPE_TEXT = 'text';
export const STOCK_FILE_TYPE_IMAGE = 'image';
export const STOCK_FILE_TYPE_VIDEO = 'video';

export function mimeTypeFromFilename(filename) {
  // eslint-disable-next-line no-param-reassign
  filename = filename.toLowerCase();

  if (filename.endsWith('.mp4')) {
    return 'video/mp4';
  }

  if (filename.endsWith('.mov')) {
    return 'video/quicktime';
  }

  if (filename.endsWith('.webm')) {
    return 'video/webm';
  }

  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (filename.endsWith('.png')) {
    return 'image/png';
  }

  if (filename.endsWith('.gif')) {
    return 'image/gif';
  }

  return 'application/octet-stream';
}

export function checkDuplicateFiles(files, flist1, flist2, text) {
  const xx = {};

  for (const ff of files) {
    const ident = ff.getFileIdentifier();
    if (xx[ident] === undefined) {
      xx[ident] = true;
    } else {
      console.log('BUG', text,
        flist1.map(f => `${f.getFileIdentifier()} ${f.getDate()} ${f.getOrdering()}`),
        flist2.map(f => `${f.getFileIdentifier()} ${f.getDate()} ${f.getOrdering()}`));
    }
  }
}

function randomizeFilename(filename, replace_ext) {
  // [original-file-name].<random-string>.[original-ext or replace_ext]

  const infix = crypto.randomHexString(8);
  const dot_point = filename.lastIndexOf('.');
  let fname;
  let fext;

  if (dot_point > 0) {
    fname = filename.slice(0, dot_point);
    fext = replace_ext === undefined ? filename.slice(dot_point + 1) : replace_ext;
  } else {
    fname = filename;
    fext = replace_ext === undefined ? '' : replace_ext;
  }

  return `${fname}.${infix}.${fext}`;
}

export function getMediaTypeForFile(file) {
  const filename = file.name;

  const video_ext = ['.mp4', '.mov'];
  const image_ext = ['.jpg', '.jpeg', '.png', '.gif'];

  for (const e of video_ext) {
    if (filename.toLowerCase().endsWith(e)) {
      return MEDIA_TYPE_VIDEO;
    }
  }

  for (const e of image_ext) {
    if (filename.toLowerCase().endsWith(e)) {
      return MEDIA_TYPE_IMAGE;
    }
  }

  return MEDIA_TYPE_BINARY;
}

export function readFile(inputFileObj, offset, length) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new DOMException('read failed'));
    };

    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(inputFileObj.slice(offset, offset + length));
  });
}

export function getThumbURL(app, stockFile, album, download_url, download_auth) {
  const bucket_name = album.getBucketName();
  return (download_url + '/file/' + bucket_name + '/' + stockFile.getThumbBucketPath()
    + '?Authorization=' + download_auth);
}

export function getURLForBucketPath(album, download_url, download_auth, bucket_path) {
  const bucket_name = album.getBucketName();
  return (download_url + '/file/' + bucket_name + '/' + bucket_path
    + '?Authorization=' + download_auth);
}

export function getFileURL(app, stock_file, album, download_url, download_auth) {
  return getURLForBucketPath(
    album, download_url, download_auth, stock_file.getBucketPath()
  );
}

// for images, this only loads the thumbnail
export const loadAndDecryptFile = async (app, album, f) => {
  // TODO: check if this function is sometimes called
  // for files which have the thumbnail already loaded

  let success = false;

  try {
    f.setDataLoadInProgress(true);

    const t = f.getFileType();
    const encrypted = album.getEncrypted();

    if (t === STOCK_FILE_TYPE_IMAGE || t === STOCK_FILE_TYPE_VIDEO) {
      const album_identifier = album.getAlbumIdentifier();
      const { download_auth, download_url } = await app.getAlbumDownloadAuth(album_identifier);

      const file_url = getThumbURL(app, f, album, download_url, download_auth);

      const index_loaded = (t === STOCK_FILE_TYPE_VIDEO)
        ? await app.loadFileIndexInfo(album, f)
        : false;

      // f.setDownloadURL(file_url);
      if (encrypted) {
        const file_contents_xhr = await httpGetBinary(file_url);
        const encrypted_data = new Uint8Array(Buffer.from(file_contents_xhr.response));
        const decrypted_data = crypto.symmetricDecrypt(f.getFileKey(), encrypted_data);
        const contents_resppack = unpackValue(decrypted_data);
        const image_data = URL.createObjectURL(
          new Blob([contents_resppack.thumb.data], { type: 'image/jpeg' })
        );

        f.setThumbDataURL(image_data);
      } else { // clear
        f.setThumbDataURL(file_url);

        // for clear video files, load authorized URL of the main video file
        // NOTE: when streaming videos is supported, this should be URL of the
        // streaming video file
        if (t === STOCK_FILE_TYPE_VIDEO && index_loaded) {
          const video_index_info = f.getIndexInfo(MEDIA_TYPE_VIDEO);
          // eslint-disable-next-line no-shadow
          const file_url = getURLForBucketPath(
            album,
            download_url,
            download_auth,
            video_index_info.large_file_bucket_path
          );
          video_index_info.clear_download_url = file_url;
        }
      }
      f.setDataLoaded();
    }

    success = true;
  } catch (err) {
    console.error(err);
  } finally {
    f.setDataLoadInProgress(false);
  }
  return success;
};

// load main image
export const loadAndDecryptMainImage = async (app, album, f) => {
  const t = f.getFileType();
  const encrypted = f.getEncrypted();

  if ((t === STOCK_FILE_TYPE_IMAGE /* || t == STOCK_FILE_TYPE_VIDEO */)
    && f.getImageDataURL() == null) {
    const mime_type = mimeTypeFromFilename(f.getName());

    const album_identifier = album.getAlbumIdentifier();
    const { download_auth, download_url } = await app.getAlbumDownloadAuth(album_identifier);

    const file_url = getFileURL(app, f, album, download_url, download_auth);

    if (encrypted) {
      const file_contents_xhr = await httpGetBinary(file_url);
      const encrypted_data = new Uint8Array(Buffer.from(file_contents_xhr.response));
      const decrypted_data = crypto.symmetricDecrypt(f.getFileKey(), encrypted_data);
      const contents_resppack = unpackValue(decrypted_data);
      const image_data = URL.createObjectURL(
        new Blob([contents_resppack.file.data], { type: mime_type })
      );
      f.setImageDataURL(image_data);
    } else {
      f.setImageDataURL(file_url);
    }
  }
};

async function uploadDataToB2(
  app, album, file_bucket_path, mime_type, file_digest, upload_file_bucket_pack
) {
  const album_identifier = album.getAlbumIdentifier();

  let upload_token; let upload_url; let token_timestamp;

  const getUploadURL = async () => {
    const token_from_cache = app.uploadTokenCacheTake(album);
    [upload_token, upload_url, token_timestamp] = token_from_cache;

    if (upload_token === null) {
      const xhr = await apiBucketUploadToken(packValue({
        album: {
          identifier: album_identifier,
        }
      }));

      if (xhr.status !== 200) {
        return { file_identifier: null, status: xhr.status };
      }

      const resppack = unpackValue(xhr.response);
      // eslint-disable-next-line prefer-destructuring
      upload_url = resppack.bucket.upload_url;
      upload_token = resppack.bucket.upload_auth;
      token_timestamp = Date.now() / 1000;
    }

    return {};
  };

  await getUploadURL();

  // NOTE: b2 doesn't support making multiple concurrent requests with the same upload token
  // (this is by design). it returns "400: same upload token is used twice". We need multiple
  // upload tokens for concurrent uploads

  let file_resp;

  for (let retries = 0; retries < 5; retries += 1) {
    file_resp = await httpPost(
      upload_url,
      upload_file_bucket_pack,
      {
        'authorization': upload_token,
        'x-bz-file-name': file_bucket_path,
        'content-type': mime_type,
        'x-bz-content-sha1': file_digest,
      }
    );

    if (file_resp.status === 200) {
      break;
    }

    if (file_resp.status >= 500) {
      await getUploadURL();
      // eslint-disable-next-line no-continue
      continue;
    }

    // some other error
    return file_resp;
  }

  if (file_resp.status !== 200) {
    return file_resp;
  }


  // only put token back if everything went well, otherwise it might be invalid
  app.uploadTokenCachePut(album, upload_token, upload_url, token_timestamp);

  return file_resp;
}

// return file_identifier on success, null otherwise
export async function uploadImageFile(
  app, user, album, filename, file_type /* STOCK_FILE_TYPE_... */,
  file_key, file_contents, thumbnail, file_date, orientation, media_type,
  encrypted, ordering, existing_file_identifier,
) {
  // if existing_file_identifier is not null, then it's an update for an existing file

  const album_identifier = album.getAlbumIdentifier();
  const album_key = encrypted ? album.getAlbumKey() : null;

  const bucket_prefix = album.getAlbumBucketPrefix();

  const upload_file_bucket_pack = encrypted ? crypto.symmetricEncrypt(file_key, packValue({
    file: {
      name: filename,
      data: file_contents,
    },
  })) : file_contents;

  const file_digest = crypto.digestSHA1(upload_file_bucket_pack);

  const upload_thumb_bucket_pack = encrypted ? crypto.symmetricEncrypt(file_key, packValue({
    thumb: {
      name: filename,
      data: thumbnail,
    },
  })) : file_contents;

  const thumb_digest = crypto.digestSHA1(upload_thumb_bucket_pack);

  let file_bucket_path; let thumb_bucket_path;

  if (encrypted) {
    file_bucket_path = bucket_prefix + '/' + file_digest;
    thumb_bucket_path = bucket_prefix + '/' + thumb_digest;
  } else {
    // keep original extension for the main file, but always use .jpg for thumb
    const bucket_fn = randomizeFilename(filename);
    const bucket_thumb_fn = randomizeFilename(filename, 'thumb.jpg');
    file_bucket_path = `${bucket_prefix}/${bucket_fn}`;
    thumb_bucket_path = `${bucket_prefix}/${bucket_thumb_fn}`;
  }

  const mime_type = encrypted ? 'application/octet-stream' : mimeTypeFromFilename(filename);

  const file_resp_promise = /* await */ uploadDataToB2(
    app, album, file_bucket_path, mime_type, file_digest, upload_file_bucket_pack
  );

  const thumb_resp_promise = /* await */ uploadDataToB2(
    app, album, thumb_bucket_path, 'application/octet-stream', thumb_digest, upload_thumb_bucket_pack
  );

  const file_resp = await file_resp_promise;
  const thumb_resp = await thumb_resp_promise;

  if (file_resp.status !== 200) {
    return { file_identifier: null, status: file_resp.status };
  }

  if (thumb_resp.status !== 200) {
    return { file_identifier: null, status: thumb_resp.status };
  }

  const bucket_size = upload_file_bucket_pack.length + upload_thumb_bucket_pack.length;

  const file_resp_json = JSON.parse(file_resp.responseText);
  const thumb_resp_json = JSON.parse(thumb_resp.responseText);

  const bucket_file_id = file_resp_json.fileId;
  const bucket_file_name = file_resp_json.fileName;
  const bucket_thumb_id = thumb_resp_json.fileId;
  const bucket_thumb_name = thumb_resp_json.fileName;

  const file_data_pack = packValue({
    file: {
      name: filename,
      path: file_bucket_path,
      thumbpath: thumb_bucket_path,
      orientation,
      file_type,
      // the below fields contain fileId and fileName as required
      // by b2 file delete api
      file_id: bucket_file_id,
      thumb_id: bucket_thumb_id,
    },
  });

  const upload_data_pack = (encrypted
    ? crypto.symmetricEncrypt(file_key, file_data_pack)
    : file_data_pack
  );

  const encrypted_file_key = (encrypted
    ? crypto.symmetricEncrypt(album_key, file_key)
    : null
  );

  let xhr_file;

  if (existing_file_identifier) {
    const file_pack = packValue({
      file: {
        identifier: existing_file_identifier,
        album: album_identifier,
        encrypted_key: encrypted_file_key,
        encrypted_data: upload_data_pack,
        clear_data: 0,
        bucket_size,
        file_date: dateToYYYYMMDD(file_date),
        media_type,
        bucket_file_id,
        bucket_file_name,
        bucket_thumb_id,
        bucket_thumb_name,
        encrypted,
        ordering,
      },
    });

    xhr_file = await apiFileUpdate(file_pack);
  } else {
    const file_pack = packValue({
      file: {
        album: album_identifier,
        encrypted_key: encrypted ? encrypted_file_key : 0,
        encrypted_data: encrypted ? upload_data_pack : 0,
        clear_data: encrypted ? 0 : upload_data_pack,
        bucket_size,
        file_date: dateToYYYYMMDD(file_date),
        media_type,
        bucket_file_id,
        bucket_file_name,
        bucket_thumb_id,
        bucket_thumb_name,
        encrypted,
        ordering,
      },
    });

    xhr_file = await apiFileCreate(file_pack);
  }

  if (xhr_file.status !== 200) {
    return { file_identifier: null, status: xhr_file.status };
  }

  return { file_identifier: unpackValue(xhr_file.response).file.identifier, status: 200 };
}

export async function uploadLargeFile(app, user, album, file_key, file_identifier, file,
  progress_callback, encrypted) {
  let upload_url; let upload_token; let index_info;

  const getUploadPartURL = async () => {
    // eslint-disable-next-line no-use-before-define
    const upload_part_xhr = await apiLargeFileGetPartUploadURL(file_identifier, file_id);
    if (upload_part_xhr.status !== 200) {
      upload_url = null;
      upload_token = null;
      return;
    }
    const resp_json = unpackValue(upload_part_xhr.response);
    // eslint-disable-next-line prefer-destructuring
    upload_url = resp_json.upload_url;
    // eslint-disable-next-line prefer-destructuring
    upload_token = resp_json.upload_token;
  };

  const prepareUploadPack = (part /* part index */, range_start, range_end, part_contents) => {
    let merged_pack;

    if (encrypted) {
      const upload_part_bucket_pack = packAndSymmetricEncryptValue(file_key, {
        part,
        data: part_contents,
        range_start,
        range_end,
      });

      const upload_part_size = upload_part_bucket_pack.length;

      index_info.index_list.push({
        // eslint-disable-next-line no-use-before-define
        index_info_size: fixed_index_size,
        index_version: 1,
        part,
        range_start,
        range_end,
        encrypted_part_size: upload_part_size,
      });

      // around 128 bytes
      const encrypted_index_bucket_pack = packAndSymmetricEncryptValue(file_key, {
        index_version: 1,
        part,
        range_start,
        range_end,
        encrypted_part_size: upload_part_size,
      });

      // we want the encrypted index to have a fixed size in stream
      // eslint-disable-next-line no-use-before-define
      const fixed_index_pack = new Uint8Array(fixed_index_size);
      _bytes_to_array(
        new DataView(fixed_index_pack.buffer), 0, encrypted_index_bucket_pack
      );

      // eslint-disable-next-line no-use-before-define
      merged_pack = new Uint8Array(upload_part_size + fixed_index_size);
      merged_pack.set(fixed_index_pack);
      // eslint-disable-next-line no-use-before-define
      merged_pack.set(upload_part_bucket_pack, fixed_index_size);
    } else { // clear
      index_info.index_list.push({
        index_info_size: 0,
        index_version: 1,
        part,
        range_start,
        range_end,
      });
      merged_pack = part_contents;
    }
    return merged_pack;
  };

  const file_size = file.size;
  const is_small_file = file_size < 6000000;

  if (is_small_file) {
    // B2 doesn't support large_file API for small files
    // therefore small videos are uploaded as a single file (similar to images)
    // and then an index is inserted with apiLargeFileFinish() which
    // gets a special flag to skip call to B2 API large_file_finish, but
    // to still insert the index

    const bucket_prefix = album.getAlbumBucketPrefix();

    // const range_end = file_size;
    const part_contents = new Uint8Array(await readFile(file, 0, file_size));

    const upload_file_bucket_pack = encrypted ? crypto.symmetricEncrypt(file_key, packValue({
      file: {
        name: file.name,
        data: part_contents,
      },
    })) : part_contents;

    const file_digest = crypto.digestSHA1(upload_file_bucket_pack);

    let file_bucket_path;

    if (encrypted) {
      file_bucket_path = bucket_prefix + '/' + file_digest;
    } else {
      // eslint-disable-next-line no-undef
      const bucket_fn = randomizeFilename(filename);
      file_bucket_path = `${bucket_prefix}/${bucket_fn}`;
    }

    const mime_type = encrypted ? 'application/octet-stream' : mimeTypeFromFilename(file.name);

    const file_resp = await uploadDataToB2(
      app, album, file_bucket_path, mime_type, file_digest, upload_file_bucket_pack
    );

    const file_resp_json = JSON.parse(file_resp.responseText);

    index_info = {
      file_identifier,
      large_file_media_type: MEDIA_TYPE_VIDEO,
      large_file_id: file_resp_json.fileId,
      large_file_bucket_path: file_resp_json.fileName,
      index_list: [], // empty index list means it's a "small large" file
    };

    let large_file_finish_pack;

    if (encrypted) {
      const encrypted_index_info_pack = packAndSymmetricEncryptValue(file_key, index_info);
      large_file_finish_pack = packValue({
        file_identifier,
        file_id: file_resp_json.fileId,
        // file_name and file_size are only present for small files
        // otherwise returned by B2 finish_large_file API
        file_name: file_resp_json.fileName,
        file_size: file_resp_json.contentLength,
        sha1_list: [],
        index_info_pack: encrypted_index_info_pack,
        finish_large_file: 0,
      });
    } else { // clear
      const index_info_pack = packValue(index_info);
      large_file_finish_pack = packValue({
        file_identifier,
        file_id: file_resp_json.fileId,
        file_name: file_resp_json.fileName,
        file_size: file_resp_json.contentLength,
        sha1_list: [],
        index_info_pack,
        finish_large_file: 0,
      });
    }

    const finish_xhr = await apiLargeFileFinish(large_file_finish_pack);

    return finish_xhr.status === 200;
  } // small file stuff

  const large_file_start_pack = packValue({
    file_identifier,
    encrypted,
    clear_filename: encrypted ? '' : randomizeFilename(file.name),
  });

  let large_file_start_xhr;

  for (let i = 0; i < 3; i += 1) {
    large_file_start_xhr = await apiLargeFileStart(large_file_start_pack);
    if (large_file_start_xhr.status === 200) {
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (large_file_start_xhr.status !== 200) {
    return false;
  }

  const { file_id, file_bucket_path } = unpackValue(large_file_start_xhr.response);
  const chunk_size = 5 * 1024 * 1024;

  await getUploadPartURL();

  let part = 1;

  const part_sha1_list = [];
  index_info = {
    file_identifier,
    large_file_media_type: MEDIA_TYPE_VIDEO,
    large_file_id: file_id,
    large_file_bucket_path: file_bucket_path,
    index_list: [],
  };

  // fixed index info byte size within the encrypted stream
  // if you add data to the index, make sure fixed_index_size is
  // sufficient to hold it (and bump index_version?)
  const fixed_index_size = 1024;

  let total_uploaded_bytes = 0;

  for (let range_start = 0; range_start < file_size; range_start += chunk_size, part += 1) {
    const range_end = Math.min(range_start + chunk_size, file_size);
    const part_contents = new Uint8Array(
      await readFile(file, range_start, range_end - range_start)
    );

    const merged_pack = prepareUploadPack(part, range_start, range_end, part_contents);

    const merged_digest = crypto.digestSHA1(merged_pack);
    part_sha1_list.push(merged_digest);

    let part_resp;

    for (let retries = 0; retries < 5; retries += 1) {
      part_resp = await httpPost(
        upload_url,
        merged_pack,
        {
          'authorization': upload_token,
          'x-bz-part-number': part,
          'x-bz-content-sha1': merged_digest,
        }
      );

      if (part_resp.status === 200) {
        break;
      }

      if (part_resp.status >= 500) {
        await getUploadPartURL();
        // eslint-disable-next-line no-continue
        continue;
      }

      return false;
    }

    if (part_resp.status !== 200) {
      return false;
    }

    total_uploaded_bytes += merged_pack.length;
    progress_callback(file, total_uploaded_bytes);
  }

  let large_file_finish_pack;

  if (encrypted) {
    const encrypted_index_info_pack = packAndSymmetricEncryptValue(file_key, index_info);
    large_file_finish_pack = packValue({
      file_identifier,
      file_id,
      sha1_list: part_sha1_list,
      index_info_pack: encrypted_index_info_pack,
      finish_large_file: 1,
    });
  } else { // clear
    const index_info_pack = packValue(index_info);
    large_file_finish_pack = packValue({
      file_identifier,
      file_id,
      sha1_list: part_sha1_list,
      index_info_pack,
      finish_large_file: 1,
    });
  }

  let finish_xhr;

  for (let i = 0; i < 3; i += 1) {
    finish_xhr = await apiLargeFileFinish(large_file_finish_pack);
    if (finish_xhr.status === 200) {
      break;
    }
  }

  return finish_xhr.status === 200;
}

// NOTE: text comes as a separate parameter. It's not yet assigned to the file object.
// file.setComment() will be called after a successful turnaround to the server
export async function uploadTextFile(app, user, album, file, text, after_identifier) {
  const encrypted = album.getEncrypted();

  const file_data_pack = packValue({
    file: {
      name: '',
      path: '',
      thumbpath: '',
      orientation: 0,
      file_type: STOCK_FILE_TYPE_TEXT,
    },
  });

  let upload_data_pack; let encrypted_file_key; let upload_text;
  const album_identifier = album.getAlbumIdentifier();

  if (encrypted) {
    const album_key = album.getAlbumKey();
    const file_key = file.getFileKey(); // crypto.symmetricGenerateKey();

    upload_data_pack = crypto.symmetricEncrypt(file_key, file_data_pack);
    encrypted_file_key = crypto.symmetricEncrypt(album_key, file_key);

    upload_text = crypto.symmetricEncrypt(file_key, text);
  } else {
    upload_data_pack = file_data_pack;
    encrypted_file_key = 0;
    upload_text = text;
  }

  const file_pack = packValue({
    file: {
      album: album_identifier,
      encrypted_key: encrypted_file_key,
      encrypted_data: encrypted ? upload_data_pack : 0,
      clear_data: encrypted ? 0 : upload_data_pack,
      bucket_size: 0,
      bucket_file_id: 0,
      bucket_file_name: '',
      bucket_thumb_id: 0,
      bucket_thumb_name: '',
      encrypted_comment: encrypted ? upload_text : 0,
      clear_comment: encrypted ? 0 : upload_text,
      after_identifier,
      file_date: dateToYYYYMMDD(file.getDate()),
      media_type: MEDIA_TYPE_COMMENT,
      encrypted,
    },
  });

  const xhr = await apiFileCreate(file_pack);
  return xhr;
}

export function createTextFile(date /* JS Date object */) {
  const identifier = 0;
  const key = crypto.symmetricGenerateKey();
  const name = '';
  const bucket_path = '';
  const thumb_bucket_path = '';
  const b2_file_id = null;
  const b2_thumb_id = null;
  const file_date = null;
  const orientation = 0;
  const comment = '';
  const file_type = 'text';

  // eslint-disable-next-line no-use-before-define
  const f = new StockFile(identifier, key, name,
    bucket_path, thumb_bucket_path, b2_file_id, b2_thumb_id,
    file_date, -1 /* ordering */,
    orientation, comment, file_type, 0,
    true /* ecnrypted */,
    1 /* can_edit_file */,
    1 /* can_delete_file */);

  f.file_date = date;
  return f;
}

export function sameYMD(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate()
  );
}

function compareInTimeline(file1, file2) {
  // return values:
  // -1 file1 is above file2 in the timeline
  // 1 file2 is above file1 in the timeline
  // 0 same position (duplicates)

  const d1 = file1.getDate();
  const d2 = file2.getDate();

  if (d1 > d2) {
    return -1;
  }
  if (d1 < d2) {
    return 1;
  }

  const ord1 = file1.getOrdering();
  const ord2 = file2.getOrdering();

  if (ord1 < ord2) { // lower ordering values are shown higher
    return -1;
  }
  if (ord1 > ord2) {
    return 1;
  }

  return 0;
}

export function mergeFileListsForTimeline(flist1, flist2) {
  // flist1 and flist2 should be ordered, an entry may appear in both lists
  // flist1 entries have priority over flist2 entries

  const len1 = flist1.length;
  const len2 = flist2.length;

  if (len1 === 0) {
    return flist2;
  }
  if (len2 === 0) {
    return flist1;
  }

  let x1 = 0; let x2 = 0; let output_list = [];

  while (x1 < len1 && x2 < len2) {
    const f1 = flist1[x1];
    const f2 = flist2[x2];

    const ident1 = f1.getFileIdentifier();
    const ident2 = f2.getFileIdentifier();

    if (ident1 === ident2) {
      output_list.push(f1);
      x1 += 1;
      x2 += 1;
      // eslint-disable-next-line no-continue
      continue;
    }

    const comp = compareInTimeline(f1, f2);

    switch (comp) {
      case -1:
        output_list.push(f1);
        x1 += 1;
        break;
      case 1:
        output_list.push(f2);
        x2 += 1;
        break;
      case 0:
        output_list.push(f1);
        x1 += 1;
        x2 += 1;
        break;
      default:
        assert(false);
    }
  }

  assert(x1 === len1 || x2 === len2);

  if (x1 < len1) {
    output_list = output_list.concat(flist1.slice(x1));
  } else if (x2 < len2) {
    output_list = output_list.concat(flist2.slice(x2));
  }

  return output_list;
}

export class StockFile {
  // if you update this c-tor, make sure to update
  // createTextFile as well

  constructor(
    file_identifier,
    file_key,
    file_name,
    file_bucket_path,
    thumb_bucket_path,
    b2_file_id,
    b2_thumb_id,
    file_date /* yyyymmdd */,
    file_ordering,
    orientation,
    comment,
    file_type,
    bucket_size,
    encrypted,
    can_edit_file,
    can_delete_file
  ) {
    this.file_identifier = file_identifier;
    this.file_key = file_key;
    this.file_name = file_name;
    this.file_bucket_path = file_bucket_path;
    this.thumb_bucket_path = thumb_bucket_path;
    this.file_date = new Date(
      // eslint-disable-next-line no-bitwise
      file_date / 10000 | 0,
      // eslint-disable-next-line no-bitwise
      ((file_date / 100 | 0) % 100) - 1,
      file_date % 100
    );
    this.file_ordering = file_ordering;
    this.orientation = orientation;
    this.comment = comment;
    this.file_type = file_type;
    this.data_loaded = (this.file_type === 'text');
    this.data_load_in_progress = false;
    this.b2_file_id = b2_file_id;
    this.b2_thumb_id = b2_thumb_id;
    this.image_data_url = null;
    this.thumb_data_url = null;
    this.large_file_load_flag = false;
    this.bucket_size = bucket_size;
    this.index_info = {}; // by media type
    this.encrypted = encrypted;
    this.can_edit_file = can_edit_file;
    this.can_delete_file = can_delete_file;
    this.video_stream_url = null;

    // currently unused (commented out)
    // this.react_component = {};
  }

  getFileIdentifier() {
    return this.file_identifier;
  }

  setFileIdentifier(identifier) {
    this.file_identifier = identifier;
  }

  getName() {
    return this.file_name;
  }

  getBucketSize() {
    return this.bucket_size;
  }

  getFileKey() {
    return this.file_key;
  }

  getBucketPath() {
    return this.file_bucket_path;
  }

  getThumbBucketPath() {
    return this.thumb_bucket_path;
  }

  setDate(d) {
    this.file_date = d;
  }

  getDate() {
    return this.file_date;
  }

  getOrdering() {
    return this.file_ordering;
  }

  setImageDataURL(objURL) {
    this.image_data_url = objURL;
  }

  getImageDataURL() {
    return this.image_data_url;
  }

  setThumbDataURL(objURL) {
    this.thumb_data_url = objURL;
  }

  getThumbDataURL() {
    return this.thumb_data_url;
  }

  getOrientation() {
    return this.orientation;
  }

  setComment(text) {
    this.comment = text;
  }

  getComment() {
    return this.comment;
  }

  setDataLoaded() {
    this.data_loaded = true;
  }

  getDataLoaded() {
    return this.data_loaded;
  }

  setDataLoadInProgress(p) {
    this.data_load_in_progress = p;
  }

  getDataLoadInProgress() {
    return this.data_load_in_progress;
  }

  getFileType() {
    return this.file_type;
  }

  getB2FileId() {
    return this.b2_file_id;
  }

  getB2ThumbId() {
    return this.b2_thumb_id;
  }

  getIndexInfo(media_type) {
    return this.index_info[media_type];
  }

  setIndexInfo(media_type, index_info) {
    this.index_info[media_type] = index_info;
  }

  getEncrypted() {
    return this.encrypted;
  }

  getCanEditFile() {
    return this.can_edit_file;
  }

  getCanDeleteFile() {
    return this.can_delete_file;
  }

  getVideoStreamURL() {
    return this.video_stream_url;
  }

  setVideoStreamURL(url) {
    this.video_stream_url = url;
  }

  // getReactComponent(mode) {
  //    return this.react_component[mode];
  // }

  // setReactComponent(mode, c) {
  //    this.react_component[mode] = c;
  //    return c;
  // }
}
