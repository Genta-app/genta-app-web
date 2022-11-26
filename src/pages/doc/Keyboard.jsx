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

export const KeyboardPage = () => (
  <div className="doc-main">
    <h1>Keyboard Shortcuts</h1>

    <h2>Album View</h2>

    <div className="doc-para">
      <div className="doc-keyboard-grid">
        <div>Arrow Keys</div>
        <div>Navigate the album</div>
      </div>
      <div className="doc-keyboard-grid">
        <div>Shift + Arrow Keys</div>
        <div>Select multiple items</div>
      </div>
      <div className="doc-keyboard-grid">
        <div>Space</div>
        <div>Toggle selection of the current item</div>
      </div>
      <div className="doc-keyboard-grid">
        <div>Delete, Backspace</div>
        <div>Delete the current item (with confirmation)</div>
      </div>
      <div className="doc-keyboard-grid">
        <div>Enter</div>
        <div>View current item (enlarge)</div>
      </div>
      <div className="doc-keyboard-grid">
        <div>Esc</div>
        <div>Cancel current selection</div>
      </div>
    </div>

    <h2>Item View</h2>

    <div className="doc-keyboard-grid">
      <div>Left/Right Arrow</div>
      <div>Go to prev/next item</div>
    </div>
    <div className="doc-keyboard-grid">
      <div>Esc</div>
      <div>Back to album</div>
    </div>

  </div>
);
