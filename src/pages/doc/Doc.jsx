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

import { InformationPolicyPage } from './InformationPolicy';
import { PrivacyPolicyPage } from './PrivacyPolicy';
import { TOSPage } from './tos';
import { AttachBackblazeStoragePage } from './AttachBackblaze';

import * as m from '../../components/Menu';

const DocPageWrapper = ({
  user, app, albums, children
}) => {
  const show_side_menu = app.getShowSideMenu();

  return (
    <div className="main">
      <m.TopBar user={user} app={app} />
      {show_side_menu && (
        <m.SideMenu
          user={user}
          app={app}
          albums={albums}
          onClose={() => app.setShowSideMenu(false)}
        />
      )}
      {children}
    </div>
  );
};

export const DocPage = (props) => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route path={`${path}/tos`}>
        <DocPageWrapper {...props}>
          <TOSPage {...props} />
        </DocPageWrapper>
      </Route>
      <Route path={`${path}/privacy-policy`}>
        <DocPageWrapper {...props}>
          <PrivacyPolicyPage {...props} />
        </DocPageWrapper>
      </Route>
      <Route path={`${path}/information-policy`}>
        <DocPageWrapper {...props}>
          <InformationPolicyPage {...props} />
        </DocPageWrapper>
      </Route>
      <Route path={`${path}/attach-backblaze-storage`}>
        <DocPageWrapper {...props}>
          <AttachBackblazeStoragePage {...props} />
        </DocPageWrapper>
      </Route>
    </Switch>
  );
};
