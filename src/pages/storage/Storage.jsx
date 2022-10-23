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

/* eslint-disable no-else-return */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable lines-between-class-members */

import React from 'react';

import {
  Switch,
  Route,
  useHistory,
} from 'react-router-dom';


import * as c from '../../components/Controls';

import { PageContentWrapper } from '../PageContentWrapper';
import { StorageList } from './StorageList';
import { AttachBucket, AttachExistingBucket } from './AttachExistingBucket';
import { AttachNewBucket } from './AttachNewBucket';
import { BucketDetails } from './BucketDetails';
import { DetachBucket } from './DetachBucket';

const Dialog = ({ title, exitPath }) => {
  const history = useHistory();

  return (
    <div className="main-form">
      <div className="form-title">{title}</div>
      <c.WhiteButton
        onClick={() => history.push(exitPath)}
        title="OK"
      />
    </div>
  );
};

export const StoragePage = (props) => {
  const { buckets } = props;

  return (
    <Switch>
      <Route exact path="/storage">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <StorageList {...{ buckets }} />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/attach">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <AttachBucket />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/attach/create">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <AttachNewBucket {...props} />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/attach/existing">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <AttachExistingBucket {...props} />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/:bucket_ident">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <BucketDetails {...props} />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/detach/:bucket_ident">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <DetachBucket {...props} />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/attach/success">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <Dialog title="Successfully Attached Storage" exitPath="/storage" />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/detach/:bucket_ident/success">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <Dialog title="Storage Detached" exitPath="/storage" />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
      <Route exact path="/storage/detach/:bucket_ident/error">
        <PageContentWrapper {...props}>
          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <Dialog title="Error Detaching Storage" exitPath="/storage" />
            </div>
          </div>
        </PageContentWrapper>
      </Route>
    </Switch>
  );
};
