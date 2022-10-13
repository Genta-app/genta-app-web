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

/* eslint-disable no-restricted-syntax */

import React from 'react';

export const LoadingScreen = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'fixed',
    width: '100vw',
    height: '100vh',
    fontWeight: 'bold',
    backgroundColor: 'rgb(61, 65, 79)',
    color: 'rgba(255, 255, 255, 0.75)'
  }}
  >
    Loading...
  </div>
);

export const WaitForValidUser = ({ user, children }) => {
  if (user === null) {
    return <LoadingScreen />;
  }

  const auth = user.getAuth();

  if (!auth) {
    const path = window.location.pathname;
    const auth_path_list = ['/view', '/account', '/storage', '/upload'];

    for (const p of auth_path_list) {
      if (path.startsWith(p)) {
        window.location = '/';
        return <></>;
      }
    }
  }

  return <>{children}</>;
};
