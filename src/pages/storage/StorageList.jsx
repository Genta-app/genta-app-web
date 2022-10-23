/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

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

import React from 'react';
import { useHistory } from 'react-router-dom';

import * as c from '../../components/Controls';
import * as icon from '../../components/Icons';

function BucketListItem({ bucket }) {
  const history = useHistory();

  const label_text = bucket.getBucketName();
  const ident = bucket.getBucketIdentifier();

  return (
    <div
      className="storage-list-item"
      data-testid={`bucket-item-${label_text}`}
      onClick={() => history.push(`storage/${ident}`)}
    >
      { label_text }
      <icon.ArrowRightShort width="2rem" height="2rem" />
    </div>
  );
}


export const StorageList = ({ buckets }) => {
  const history = useHistory();

  return (
    <div className="main-form">
      <div className="form-title" style={{ marginBottom: '4rem' }}>Your Storage</div>

      {buckets.map(b => <BucketListItem key={b.getBucketIdentifier()} bucket={b} />)}

      <c.WhiteButton
        onClick={() => history.push('/storage/attach')}
        title="ATTACH STORAGE"
      />
    </div>
  );
};
