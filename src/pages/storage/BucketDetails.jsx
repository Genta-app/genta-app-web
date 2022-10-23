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
import { useHistory, useParams } from 'react-router-dom';

import * as c from '../../components/Controls';
import { If } from '../../components/JSXFlow';

export const BucketDetails = ({ buckets, user }) => {
  const { bucket_ident } = useParams();
  const history = useHistory();

  const bucket0 = buckets.filter(b => b.getBucketIdentifier() === bucket_ident);

  if (bucket0.length === 0) {
    return (
      <>
        <div className="main-form">
          <div className="form-title">Bucket Not Found</div>
          <c.WhiteButton
            onClick={() => history.push('/storage')}
            title="BACK"
          />
        </div>
      </>
    );
  }

  const bucket = bucket0[0];
  const is_system = bucket.isSystemBucket();
  const service = is_system ? 'GENTA.APP' : bucket.getServiceName();
  const prefix = bucket.getBucketPrefix();

  return (
    <>
      <div className="main-form">
        <div className="form-title">Storage Details</div>

        <c.StaticText label="PROVIDER">
          { service }
        </c.StaticText>

        <c.StaticText label="NAME">
          { bucket.getBucketName() }
        </c.StaticText>

        <If condition={!is_system}>
          <c.StaticText label="PATH PREFIX">
            { prefix.length === 0 ? '(EMPTY)' : prefix }
          </c.StaticText>
        </If>

        <c.StaticText label="DEFAULT">
          { user.getDefaultBucketIdent() === bucket.getBucketIdentifier() ? 'YES' : 'NO' }
        </c.StaticText>

        <c.WhiteButton
          onClick={() => history.push('/storage')}
          title="BACK"
        />

        <If condition={!is_system}>
          <c.DangerButton
            style={{ marginTop: '1rem' }}
            onClick={() => history.push(`/storage/detach/${bucket_ident}`)}
            title="DETACH"
          />
        </If>
      </div>
    </>
  );
};
