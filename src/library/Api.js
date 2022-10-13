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

/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-template */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-else-return */

import {
  httpGetBinary,
  httpPost,
  httpPut,
  httpDelete
} from './Req';
import { packValue, unpackValue } from './Pack';
import { Bucket } from './Bucket';
import { Album } from './Album';
// eslint-disable-next-line import/no-cycle
import {
  StockFile,
  STOCK_FILE_TYPE_IMAGE,
  STOCK_FILE_TYPE_VIDEO,
  MEDIA_TYPE_VIDEO,
} from './File';
import * as crypto from './Crypto'; // TODO: named function imports

const API_BASE_URL = '/api/v1';

// misc

// based on documentation and example from here:
// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/btoa
export function toBinaryString(uint8arr /* Uint8Array */) {
  return String.fromCharCode(...uint8arr);
}

// genta analytics

export async function apiGentaAnalytics(jsondata) {
  return /* await */ httpPost(API_BASE_URL + '/genta-analytics', JSON.stringify(jsondata));
}

// users

export async function userApply(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/apply', pack);
}

export async function apiUserCreate(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/user', pack);
}

export async function apiLogin(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/login', pack, {}, 'arraybuffer');
}

export async function apiPostRecall() {
  return /* await */ httpPost(API_BASE_URL + '/recall', new Uint8Array(), {}, 'arraybuffer');
}

export async function apiGetRecall() {
  return /* await */ httpGetBinary(API_BASE_URL + '/recall');
}

export async function apiUpgradeAccount() {
  return /* await */ httpPost(API_BASE_URL + '/upgrade-account', new Uint8Array(), {}, 'arraybuffer');
}

export async function apiLogout() {
  return /* await */ httpPost(API_BASE_URL + '/logout', new Uint8Array(), {}, 'arraybuffer');
}

export async function apiUserChangePassword(pack /* Uint8Array */) {
  return /* await */ httpPut(API_BASE_URL + '/password', pack);
}

export async function apiUpdateUser(pack /* Uint8Array */) {
  return /* await */ httpPut(API_BASE_URL + '/user', pack);
}

export async function apiLoadGuestList() {
  const xhr = await httpGetBinary(API_BASE_URL + '/guests');
  const unpack = unpackValue(xhr.response);
  const guest_list = [];

  for (const email of unpack.guests) {
    guest_list.push(email);
  }

  return guest_list;
}

export async function apiInvite(user, email_to) {
  const pack = packValue({ email_to });
  const xhr = await httpPost(API_BASE_URL + '/invite', pack);
  return xhr.status === 200;
}


export async function apiShareAlbum(user, album, email_to, share_allow_add_files) {
  const public_key_xhr = await httpGetBinary(
    API_BASE_URL + '/user-public-key?email=' + encodeURIComponent(email_to)
  );

  if (public_key_xhr.status !== 200) {
    return 400;
  }

  const public_key_to = unpackValue(public_key_xhr.response).public_key;

  if (public_key_to.length > 0) { // user exists
    const private_key_from = user.getPrivateKey();
    const album_key = album.getAlbumKey();

    const encrypted_album_key = crypto.cryptoBox(private_key_from, public_key_to, album_key);

    const album_identifier = album.getAlbumIdentifier();

    const pack = packValue({
      encrypted_album_key,
      album_identifier,
      email_to,
      allow_add_files: share_allow_add_files ? 1 : 0,
    });

    const xhr = await httpPost(API_BASE_URL + '/share-album', pack);
    return xhr.status;
  } else { // user doesn't exist
    /* const album_identifier = album.getAlbumIdentifier();
    const pack = packValue({
        encrypted_album_key: "",
        album_identifier: album_identifier,
        email_to: email_to,
    });

    const xhr = await httpPost(API_BASE_URL + "/share-album", pack);
    return xhr.status == 200;
    */

    return 409;
  }
}

export async function apiDeleteUser() {
  return /* await */ httpDelete(API_BASE_URL + '/user');
}

export async function apiDeleteSharedAlbum(album, email_to) {
  const album_identifier = album.getAlbumIdentifier();
  const param = 'album=' + album_identifier + '&email=' + encodeURIComponent(email_to);
  const xhr = await httpDelete(API_BASE_URL + '/share-album?' + param);
  return xhr.status === 200;
}

export async function apiRespondAlbumShare(album, response) {
  const pack = packValue({
    album_identifier: album.getAlbumIdentifier(),
    response,
  });

  const xhr = await httpPost(API_BASE_URL + '/respond-share-album', pack);
  return xhr.status === 200;
}

// buckets

export const loadBucketList = async () => {
  const xhr = await httpGetBinary(API_BASE_URL + '/bucket');
  const unpack = unpackValue(xhr.response);

  const bucket_list = [];

  for (const b of unpack.buckets) {
    bucket_list.push(new Bucket(
      b.identifier, b.name, b.service_id, b.is_system, b.bucket_prefix
    ));
  }

  return bucket_list;
};

export const updateBucket = async (pack) => {
  const xhr = await httpPut(API_BASE_URL + '/bucket', pack);
  return xhr.status === 200;
};

export const attachBucket = async (pack) => {
  const xhr = await httpPost(API_BASE_URL + '/bucket', pack);
  return xhr;
};

export const detachBucket = async (bucket) => {
  const bucket_identifier = bucket.getBucketIdentifier();
  const bucket_param = 'bucket=' + bucket_identifier;
  return /* await */ httpDelete(API_BASE_URL + '/bucket?' + bucket_param);
};

export async function apiBucketUploadToken(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/bucket-upload-token', pack, {}, 'arraybuffer');
}

export async function apiAlbumDownloadToken(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/album-download-token', pack, {}, 'arraybuffer');
}

// albums

export const loadAlbumList = async (user) => {
  const xhr = await httpGetBinary(API_BASE_URL + '/album');

  if (xhr.status !== 200) {
    return null;
  }

  const unp = unpackValue(xhr.response);
  const albums = [];

  for (const a of unp.albums) {
    const album_identifier = a.identifier;
    const owner_email = a.shared_album_owner_email;
    const can_add_files = a.shared_album_can_add_files;
    const album_share_list = a.share_list;

    const {
      bucket_name,
      bucket_identifier,
      encrypted_album_key,
      encrypted_data,
      file_count,
      max_date,
      min_date,
      yyyymm_list,
      created,
      bucket_size,
      bucket_prefix,
      public_key,
      accepted,
      encrypted,
    } = a;

    try {
      let album_key;
      let album_name;

      if (encrypted) {
        album_key = crypto.cryptoBoxOpen(
          user.getPrivateKey(),
          public_key,
          encrypted_album_key
        );
        const data_pack = crypto.symmetricDecrypt(album_key, encrypted_data);
        const unpack_data = unpackValue(data_pack);
        album_name = unpack_data.album.name;
      } else {
        album_key = null;
        const unpack_data = unpackValue(encrypted_data);
        album_name = unpack_data.album.name;
      }

      albums.push(new Album(
        album_identifier, bucket_identifier, album_key, album_name,
        bucket_name, bucket_prefix, file_count, min_date, max_date,
        yyyymm_list, created, bucket_size, owner_email, can_add_files,
        album_share_list, accepted, encrypted
      ));
    } catch (e) {
      console.error(e);
    }
  }
  return albums;
};

const createEncryptedAlbum = async (user, album_name, bucket_identifier) => {
  const private_key = user.getPrivateKey();
  const public_key = user.getPublicKey();

  const album_key = crypto.symmetricGenerateKey();
  const encrypted_album_key = crypto.cryptoBox(private_key, public_key, album_key);

  const encrypted_album_data = crypto.symmetricEncrypt(
    album_key,
    packValue({
      album: {
        name: album_name,
      }
    })
  );

  const pack = packValue({
    album: {
      bucket_identifier,
      encrypted_album_key,
      encrypted_album_data,
      encrypted: 1,
    },
  });

  const xhr = await httpPost(API_BASE_URL + '/album', pack, {}, 'arraybuffer');
  return xhr;
};

const createUnencryptedAlbum = async (user, album_name, bucket_identifier) => {
  const clear_album_data = packValue({
    album: {
      name: album_name,
    }
  });

  const pack = packValue({
    album: {
      bucket_identifier,
      clear_album_data,
      encrypted: 0,
    },
  });

  const xhr = await httpPost(API_BASE_URL + '/album', pack, {}, 'arraybuffer');
  return xhr;
};

export const createAlbum = async (user, album_name, bucket_identifier, encrypt) => {
  if (encrypt) {
    return createEncryptedAlbum(user, album_name, bucket_identifier);
  } else {
    return createUnencryptedAlbum(user, album_name, bucket_identifier);
  }
};

export const deleteAlbum = async (album_identifier) => {
  const album_param = 'album=' + album_identifier;
  const xhr = await httpDelete(API_BASE_URL + '/album?' + album_param);
  return xhr;
};

export const updateAlbum = async (user, album, album_name) => {
  let pack;

  if (album.getEncrypted()) {
    const album_key = album.getAlbumKey();

    const encrypted_album_data = crypto.symmetricEncrypt(
      album_key,
      packValue({
        album: {
          name: album_name,
        }
      })
    );

    pack = packValue({
      album: {
        identifier: album.getAlbumIdentifier(),
        album_data: encrypted_album_data,
      },
    });
  } else {
    const clear_album_data = packValue({
      album: {
        name: album_name,
      }
    });

    pack = packValue({
      album: {
        identifier: album.getAlbumIdentifier(),
        album_data: clear_album_data,
      },
    });
  }

  const xhr = await httpPut(API_BASE_URL + '/album', pack);
  return xhr;
};


export const apiAlbumActiveDayList = async (album_identifier, year) => {
  const xhr = await httpGetBinary(
    `${API_BASE_URL}/album-day-list?album=${album_identifier}&year=${year}`
  );

  const unp = unpackValue(xhr.response);
  return unp;
};

// files

// expect only one of yyyymmdd or file_identifier to be set
// if yyyymmdd is set, select files at or before the date
// if file_identifier is set, select files relative to the file
// list_newer is only used when file_identifier is set.
// list_newer == true/false will list files newer/older than given identifier
export async function apiFileList(album /* Album */, yyyymmdd, file_identifier, list_newer) {
  const album_param = 'album=' + album.getAlbumIdentifier();
  const yyyymmdd_param = yyyymmdd ? ('&yyyymmdd=' + yyyymmdd) : '';
  const fid_param_name = list_newer ? '&efid=' : '&fid=';
  const file_ident_param = file_identifier ? (fid_param_name + file_identifier) : '';
  const encrypted = album.getEncrypted();

  const xhr = await httpGetBinary(API_BASE_URL
      + '/file?' + album_param + yyyymmdd_param + file_ident_param);

  const resppack = unpackValue(xhr.response);

  const files = [];

  for (const f of resppack.files) {
    // eslint-disable-next-line no-shadow
    const file_identifier = f.identifier;
    const file_key = (encrypted
      ? crypto.symmetricDecrypt(album.getAlbumKey(), f.encrypted_key)
      : null);

    const file_data_pack = (encrypted
      ? crypto.symmetricDecrypt(file_key, f.encrypted_data)
      : f.clear_data);

    const file_data = unpackValue(file_data_pack);

    let file_comment = '';
    try {
      if (f.comment.length > 0) {
        file_comment = (encrypted
          ? await crypto.symmetricDecryptString(file_key, f.comment)
          : await (new Blob([f.comment]).text()));
      }
    } catch (e) {
      console.log(e);
      file_comment = '-';
    }

    files.push(new StockFile(
      file_identifier,
      file_key,
      file_data.file.name,
      file_data.file.path,
      file_data.file.thumbpath,
      file_data.file.file_id || '',
      file_data.file.thumb_id || '',
      f.file_date,
      f.file_ordering,
      file_data.file.orientation,
      file_comment,
      file_data.file.file_type || STOCK_FILE_TYPE_IMAGE,
      f.bucket_size,
      encrypted,
      f.can_edit_file,
      f.can_delete_file,
    ));
  }

  return files;
}

export async function apiFileCreate(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/file', pack, {}, 'arraybuffer');
}

export async function apiFileSetComment(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/file-comment', pack);
}

export async function apiFileDownloadToken(stock_file) {
  const pack = packValue({
    file_identifier: stock_file.getFileIdentifier(),
  });
  return /* await */ httpPost(API_BASE_URL + '/file-download-token', pack, {}, 'arraybuffer');
}


export async function apiFileCreateDirectLink(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/file-direct-link', pack);
}

export async function apiFileGetDirectLink(link_key) {
  return /* await */ httpGetBinary(API_BASE_URL + `/file-direct-link?key=${link_key}`);
}

export async function apiFileSetPosition(pack /* Uint8Array */) {
  return /* await */ httpPut(API_BASE_URL + '/file-position', pack);
}

export const apiDeleteFile = async (stock_file) => {
  const file_type = stock_file.getFileType();
  let param = 'file=' + stock_file.getFileIdentifier();

  if (file_type === STOCK_FILE_TYPE_IMAGE || file_type === STOCK_FILE_TYPE_VIDEO) {
    param += ('&fn=' + stock_file.getBucketPath()
      + '&tn=' + stock_file.getThumbBucketPath()
      + '&fid=' + stock_file.getB2FileId()
      + '&tid=' + stock_file.getB2ThumbId());
  }

  if (file_type === STOCK_FILE_TYPE_VIDEO) {
    const index_info = stock_file.getIndexInfo(MEDIA_TYPE_VIDEO);

    // proceed with delete anyway, even if index_info was not retrieved
    if (index_info) {
      param += `&lid=${index_info.large_file_id}`;
      param += `&ln=${index_info.large_file_bucket_path}`;
    }
  }

  return /* await */ httpDelete(API_BASE_URL + '/file?' + param);
};

export const apiBulkDeleteFiles = async (stock_file_list) => {
  const delete_file_list = [];

  for (const stock_file of stock_file_list) {
    const file_dict = {
      file_type: stock_file.getFileType(),
      identifier: stock_file.getFileIdentifier(),
    };

    if (file_dict.file_type === STOCK_FILE_TYPE_IMAGE
      || file_dict.file_type === STOCK_FILE_TYPE_VIDEO) {
      file_dict.bucket_filename = stock_file.getBucketPath();
      file_dict.bucket_thumbname = stock_file.getThumbBucketPath();
      file_dict.b2_fileid = stock_file.getB2FileId();
      file_dict.b2_thumbid = stock_file.getB2ThumbId();
    }

    if (file_dict.file_type === STOCK_FILE_TYPE_VIDEO) {
      const index_info = stock_file.getIndexInfo(MEDIA_TYPE_VIDEO);

      // proceed with delete anyway, even if index_info was not retrieved
      if (index_info) {
        file_dict.b2_largefileid = index_info.large_file_id;
        file_dict.b2_largefilename = index_info.large_file_bucket_path;
      }
    }
    delete_file_list.push(file_dict);
  }

  const pack = packValue({
    delete_file_list,
  });

  return /* await */ httpPost(API_BASE_URL + '/file-delete', pack, {}, 'arraybuffer');
};


export async function apiLargeFileStart(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/large-file-start', pack, {}, 'arraybuffer');
}

export async function apiLargeFileGetPartUploadURL(file_identifier, file_id /* b2 fileId */) {
  return /* await */ httpGetBinary(
    `${API_BASE_URL}/large-file-part-upload-url?file=${file_identifier}&fid=${file_id}`
  );
}

export async function apiLargeFileFinish(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/large-file-finish', pack, {}, 'arraybuffer');
}

export async function apiFileIndex(file_identifier) {
  return /* await */ httpGetBinary(API_BASE_URL + `/file-index?file=${file_identifier}`);
}

export async function apiConfirmEmail(pack /* Uint8Array */) {
  return /* await */ httpPost(API_BASE_URL + '/confirm-email', pack, {}, 'arraybuffer');
}

export async function apiFileOrdering() {
  return /* await */ httpGetBinary(API_BASE_URL + '/file-ordering');
}

export async function apiSystemSpace() {
  return /* await */ httpGetBinary(API_BASE_URL + '/system-space');
}

export async function apiPostFeedback(email, message) {
  const pack = packValue({
    email,
    message,
  });

  const xhr = await httpPost(API_BASE_URL + '/user-feedback', pack);
  return xhr.status;
}
