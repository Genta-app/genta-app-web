/* eslint-disable no-else-return */
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

import React, { useState } from 'react';
import { useHistory, useParams, Link } from 'react-router-dom';

import { detachBucket } from '../../library/Api';
import * as c from '../../components/Controls';

const AlbumListItem = ({ album }) => {
  const label_text = album.getAlbumName();

  const label = (
    <Link
      to={`/album/${album.getAlbumIdentifier()}`}
      style={{ fontSize: '1rem', textDecoration: 'none' }}
    >
      {label_text}
    </Link>
  );

  return (
    <>
      <c.StaticText
        style={{ marginTop: '0', marginBottom: '3rem' }}
        label={label}
      >
        <div style={{ fontSize: '0.9rem' }}>
          {/* some info */}
        </div>
      </c.StaticText>
    </>
  );
};

export const DetachBucket = ({
  buckets,
  albums,
  app,
  user,
}) => {
  const { bucket_ident } = useParams();
  const history = useHistory();
  const [detachInProgress, setDetachInProgress] = useState(false);

  const bucket = buckets.filter(b => b.getBucketIdentifier() === bucket_ident)[0];
  const bucket_albums = albums.filter(a => a.getBucketIdentifier() === bucket_ident);

  const handleDetachBucketClick = async () => {
    const xhr = await detachBucket(bucket);

    if (xhr.status === 200) {
      history.push(`/storage/detach/${bucket_ident}/success`);
      await app.loadBucketList(user);
    } else {
      history.push(`/storage/detach/${bucket_ident}/error`);
    }
  };

  if (bucket_albums.length > 0) {
    return (
      <>
        <div className="main-form">
          <div className="form-title" style={{ marginBottom: '4rem' }}>Detach Bucket</div>

          <c.StaticText>
            Storage <b>{bucket.getBucketName()}</b> cannot be detached, because it is
            used by the following albums:
          </c.StaticText>

          <div style={{ marginTop: '3rem' }}>
            { bucket_albums.map(a => <AlbumListItem key={a.getAlbumIdentifier()} album={a} />) }
          </div>

          <c.WhiteButton
            onClick={() => history.push(`/storage/${bucket_ident}`)}
            title="CANCEL"
          />
        </div>
      </>
    );
  } else {
    return (
      <>
        <div className="main-form">
          <div className="form-title" style={{ marginBottom: '4rem' }}>Detach Storage</div>

          <c.StaticText>
            Detach <b>{bucket.getBucketName()}</b> ?
          </c.StaticText>

          <c.StaticText>
            After detaching the storage will not be available to <b>Genta.app</b> until
            re-attached.
          </c.StaticText>

          <c.DangerButton
            onClick={() => {
              setDetachInProgress(true);
              setTimeout(handleDetachBucketClick, 100);
            }}
            disabled={detachInProgress}
            title={detachInProgress ? 'PLEASE WAIT...' : 'PERFORM DETACH'}
          />

          <c.WhiteButton
            style={{ marginTop: '1rem' }}
            onClick={() => history.push(`/storage/${bucket_ident}`)}
            title="CANCEL"
          />
        </div>
      </>
    );
  }
};
