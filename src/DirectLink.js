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

/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable quotes */
/* eslint-disable prefer-template */

import React from 'react';
import ReactDOM from 'react-dom';

import { unpackValue } from './library/Pack';

import * as crypto from './library/Crypto';

import { httpGetBinary } from './library/Req';
import { apiFileGetDirectLink } from './library/Api';

function parseURL() {
  const url = new URL(window.location);
  const url_key = url.pathname.slice(4);
  return url_key;
}

function getFileURL(bucket_name, bucket_path, download_url, download_auth) {
  return download_url + "/file/" + bucket_name + "/" + bucket_path
    + "?Authorization=" + download_auth;
}

const Logo = () => <div className="dl-logo">genta.app</div>;

class DirectLinkViewer extends React.Component {
  constructor(props) {
    super(props);

    this.is_mounted = false;
    this.state = { data: null, image_data: null, failed: false };

    const url_key = parseURL();
    let check = url_key;

    for (let i = 0; i < 1000; i += 1) {
      check = crypto.digestSHA1(check);
    }

    const link_key = "1" + check + url_key;

    crypto.so.ready.then(() => apiFileGetDirectLink(link_key)).then((xhr) => {
      if (xhr.status !== 200) {
        if (this.is_mounted) {
          this.setState({ failed: true });
        } else {
          this.state.failed = true;
        }
        return;
      }

      const resp_pack = unpackValue(xhr.response);
      const key = crypto.deriveDirectLinkKey(link_key);
      const data = unpackValue(crypto.symmetricDecrypt(key, resp_pack.data));

      if (this.is_mounted) {
        this.setState({ data });
      } else {
        this.state.data = data;
      }

      const file_url = getFileURL(
        data.bucket_name,
        data.file_name,
        data.download_url,
        data.file_download_auth,
      );

      // eslint-disable-next-line consistent-return
      return data.encrypted ? httpGetBinary(file_url) : file_url;
    }).then((xhr) => {
      // xhr if encrypted, else URL string
      // eslint-disable-next-line react/destructuring-assignment
      if (this.state.data.encrypted) {
        if (xhr.status !== 200) {
          if (this.is_mounted) {
            this.setState({ failed: true });
          } else {
            this.state.failed = true;
          }
          return;
        }

        const encrypted_data = new Uint8Array(Buffer.from(xhr.response));
        // eslint-disable-next-line react/destructuring-assignment
        const decrypted_data = crypto.symmetricDecrypt(this.state.data.key, encrypted_data);
        const contents_resppack = unpackValue(decrypted_data);

        const image_data = URL.createObjectURL(
          new Blob([contents_resppack.file.data], { type: 'image/jpeg' })
        );

        if (this.is_mounted) {
          this.setState({ image_data });
        } else {
          this.state.image_data = image_data;
        }
      } else { // unencrypted file
        // eslint-disable-next-line no-lonely-if
        if (this.is_mounted) {
          this.setState({ image_data: xhr });
        } else {
          this.state.image_data = xhr;
        }
      }
    });
  }

  componentDidMount() {
    this.is_mounted = true;
  }

  render() {
    const { image_data } = this.state;
    if (true && image_data == null) {
      return (
        <>
          <div className="dl-main">
            Loading...
            <Logo />
          </div>
        </>
      );
    }

    return (
      <>
        <div className="dl-main">
          <Logo />
          <img src={image_data} className="dl-image" />
        </div>
      </>
    );
  }
}

ReactDOM.render(
  <DirectLinkViewer />,
  document.getElementById('root')
);
