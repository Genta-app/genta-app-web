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

/* eslint-disable guard-for-in */

export function httpGet(url, headers_map) {
  return new Promise((resolve, reject) => {
    const r = new XMLHttpRequest();
    r.open('GET', url, true);
    if (headers_map) {
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const h in headers_map) {
        r.setRequestHeader(h, headers_map[h]);
      }
    }

    r.onload = () => {
      resolve(r);
    };

    r.onerror = () => {
      reject(r);
    };

    r.send();
  });
}

// TODO: refactor into a single function
export function httpGetBinary(url, headers_map) {
  return new Promise((resolve, reject) => {
    const r = new XMLHttpRequest();
    r.responseType = 'arraybuffer';
    r.open('GET', url, true);
    if (headers_map) {
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const h in headers_map) {
        r.setRequestHeader(h, headers_map[h]);
      }
    }

    r.onload = () => {
      resolve(r);
    };

    r.onerror = () => {
      reject(r);
    };

    r.send();
  });
}

export function httpPost(url, body, headers_map, resptype = '') {
  return new Promise((resolve, reject) => {
    const r = new XMLHttpRequest();
    r.responseType = resptype;
    r.open('POST', url, true);
    if (headers_map) {
      // eslint-disable-next-line guard-for-in, no-restricted-syntax
      for (const h in headers_map) {
        r.setRequestHeader(h, headers_map[h]);
      }
    }

    r.onload = () => {
      resolve(r);
    };

    r.onerror = () => {
      reject(r);
    };

    r.send(body);
  });
}

export function httpPut(url, body, headers_map, resptype = '') {
  return new Promise((resolve, reject) => {
    const r = new XMLHttpRequest();
    r.responseType = resptype;
    r.open('PUT', url, true);
    if (headers_map) {
      // eslint-disable-next-line no-restricted-syntax
      for (const h in headers_map) {
        r.setRequestHeader(h, headers_map[h]);
      }
    }

    r.onload = () => {
      resolve(r);
    };

    r.onerror = () => {
      reject(r);
    };

    r.send(body);
  });
}

export function httpDelete(url) {
  return new Promise((resolve, reject) => {
    const r = new XMLHttpRequest();
    r.open('DELETE', url, true);

    r.onload = () => {
      resolve(r);
    };

    r.onerror = () => {
      reject(r);
    };

    r.send();
  });
}
