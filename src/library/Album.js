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

/* eslint-disable prefer-template */

export function buildViewAlbumURL(album, yyyymm) {
  return '/view/' + album.getAlbumIdentifier() + '/' + (yyyymm === undefined ? '' : yyyymm);
}

export function buildUploadAlbumURL(album) {
  return '/upload/' + album.getAlbumIdentifier();
}

export const MOST_RECENTLY_UPDATED_ALBUM = 'most-recently-updated';

export class Album {
  constructor(aidt, bidt, key, name, bucket_name, bucket_prefix, file_count,
    min_date, max_date, yyyymm_list, created, bucket_size,
    owner_email, can_add_files, share_list, accepted, encrypted) {
    this.aidt = aidt;
    this.bidt = bidt;
    this.key = key;
    this.name = name;

    // needed for building file URL for shared albums
    // where we don't have access to the bucket object
    this.bucket_name = bucket_name;
    this.bucket_prefix = bucket_prefix; // pfx...: key prefix within bucket

    this.file_count = file_count;
    this.min_date = min_date;
    this.max_date = max_date;
    this.yyyymm_list = yyyymm_list;
    this.created = created;
    this.bucket_size = bucket_size;
    this.owner_email = owner_email;
    this.can_add_files = can_add_files;
    // empty for shared albums
    this.album_share_list = share_list;
    this.accepted = accepted; // always 1 for own albums
    this.encrypted = encrypted;
  }

  getAlbumKey() {
    return this.key;
  }

  getAlbumName() {
    return this.name;
  }

  setAlbumName(name) {
    this.name = name;
  }

  getBucketName() {
    return this.bucket_name;
  }

  getBucketIdentifier() {
    return this.bidt;
  }

  getAlbumIdentifier() {
    return this.aidt;
  }

  getAlbumBucketPrefix() {
    return this.bucket_prefix;
  }

  getFileCount() {
    return this.file_count;
  }

  getMinDate() {
    return this.min_date;
  }

  getMaxDate() {
    return this.max_date;
  }

  getYMList() {
    return this.yyyymm_list;
  }

  getCreated() {
    return this.created;
  }

  getBucketSize() {
    return this.bucket_size;
  }

  // empty for own albums
  getOwnerEmail() {
    return this.owner_email;
  }

  getAlbumShareList() {
    return this.album_share_list;
  }

  getAccepted() {
    return this.accepted;
  }

  getEncrypted() {
    return this.encrypted;
  }

  getCanAddFiles() {
    return this.can_add_files === 1;
  }
}
