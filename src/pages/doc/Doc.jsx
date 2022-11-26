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

/* eslint-disable import/prefer-default-export */

import React from 'react';

import { useRouteMatch, Switch, Route } from 'react-router-dom';

import { TOCPage } from './TOC';
import { AttachBackblazeStoragePage } from './AttachBackblaze';
import { KeyboardPage } from './Keyboard';
import { InformationPolicyPage } from './InformationPolicy';
import { PrivacyPolicyPage } from './PrivacyPolicy';
import { TOSPage } from './tos';
import { PageContentWrapper } from '../PageContentWrapper';

export const DocPage = (props) => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={[`${path}`, `${path}/`]}>
        <PageContentWrapper {...props}>
          <TOCPage {...props} />
        </PageContentWrapper>
      </Route>
      <Route path={`${path}/tos`}>
        <PageContentWrapper {...props}>
          <TOSPage {...props} />
        </PageContentWrapper>
      </Route>
      <Route path={`${path}/privacy-policy`}>
        <PageContentWrapper {...props}>
          <PrivacyPolicyPage {...props} />
        </PageContentWrapper>
      </Route>
      <Route path={`${path}/information-policy`}>
        <PageContentWrapper {...props}>
          <InformationPolicyPage {...props} />
        </PageContentWrapper>
      </Route>
      <Route path={`${path}/attach-backblaze-storage`}>
        <PageContentWrapper {...props}>
          <AttachBackblazeStoragePage {...props} />
        </PageContentWrapper>
      </Route>
      <Route path={`${path}/keyboard`}>
        <PageContentWrapper {...props}>
          <KeyboardPage {...props} />
        </PageContentWrapper>
      </Route>
    </Switch>
  );
};
