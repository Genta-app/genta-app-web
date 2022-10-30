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

import * as m from '../components/Menu';
import { If } from '../components/JSXFlow';

export const PageContentWrapper = ({
  user, app, albums, children, active
}) => {
  const show_side_menu = app.getShowSideMenu();

  return (
    <div className="main">
      <m.TopBar user={user} app={app} />
      <If condition={show_side_menu}>
        <m.SideMenu
          {...{
            user,
            app,
            albums,
            active
          }}
          onClose={() => app.setShowSideMenu(false)}
        />
      </If>
      {children}
    </div>
  );
};
