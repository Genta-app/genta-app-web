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
import { Link } from 'react-router-dom';

export const TOCPage = () => (
  <div className="doc-main">
    <h1>Genta.app Documentation</h1>

    <h2><Link to="/doc/attach-backblaze-storage">Attach Backblaze B2 Storage</Link></h2>

    <div className="doc-para">
      Detailed guide on how to attach a <b>Backblaze B2</b> storage to your <b>Genta.app</b> account
    </div>

    <h2><Link to="/doc/keyboard">Keyboard for Power Users</Link></h2>

    <div className="doc-para">
      Keyboard shortcuts reference
    </div>

  </div>
);