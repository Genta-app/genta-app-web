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

export class Bucket {
  constructor(bidt, name, service, is_system, prefix) {
    this.bidt = bidt;
    this.name = name;
    this.service = service;
    this.is_system = is_system;
    this.bucket_prefix = prefix;
  }

  getBucketIdentifier() {
    return this.bidt;
  }

  getBucketName() {
    return this.isSystemBucket() ? 'GENTA.APP STORAGE' : this.name;
  }

  getServiceName() {
    return this.service;
  }

  isSystemBucket() {
    return this.is_system === 1;
  }

  getBucketPrefix() {
    return this.bucket_prefix;
  }
}

export function getBucketNameFromIdentifier(bucket_ident, buckets) {
  const filtered_bucket = buckets.filter(b => b.getBucketIdentifier() === bucket_ident);
  if (filtered_bucket.length > 0) {
    return filtered_bucket[0].getBucketName();
  }
  return '';
}
