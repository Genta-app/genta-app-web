/* eslint-disable jsx-a11y/no-static-element-interactions */
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

/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable no-else-return */
/* eslint-disable prefer-template */

import React from 'react';

import * as icon from '../../components/Icons';
import * as c from '../../components/Controls';

export const DirectLinkDialog = ({ direct_link, onClose, global }) => {
  const className = 'view-album-photo-thumb-dialog' + (
    global ? ' thumb-dialog-position-global' : ''
  );

  if (direct_link) {
    return (
      <div className={className}>
        <div className="view-album-photo-thumb-dialog-title">
          DIRECT LINK TO THIS IMAGE
          <div style={{
            margin: '1rem 0 2rem 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
          >
            <c.ReadOnlyTextInput value={direct_link} />
            <c.CopyToClipboardButton value={direct_link} />
          </div>
          <div className="view-album-photo-thumb-dialog-text">
            Share this link to let others view and save the image
            <br />
            The link will expire in 24 hours
          </div>
        </div>
        <div style={{ marginTop: '-2.5rem' }}>
          <c.WhiteButtonSm title="CLOSE" onClick={onClose} />
        </div>
      </div>
    );
  } else {
    return (
      <div className={className}>
        <div className="view-album-photo-thumb-dialog-title">
          GENERATING DIRECT LINK...
          <div className="view-album-photo-thumb-dialog-text">
            Please wait...
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <c.WhiteButtonSm title="CLOSE" onClick={onClose} />
        </div>
      </div>
    );
  }
};

export const ConfirmDeleteDialog = ({ onDelete, onClose, global }) => {
  const className = ('view-album-photo-thumb-dialog'
    + (global ? ' thumb-dialog-position-global' : ''));

  return (
    <div className={className}>
      <div className="view-album-photo-thumb-dialog-title">
        DELETE ITEM?
        <div className="view-album-photo-thumb-dialog-text">
          THIS CANNOT BE UNDONE
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <c.DangerButtonSm title="DELETE" onClick={onDelete} />
        <c.WhiteButtonSm title="CANCEL" onClick={onClose} />
      </div>
    </div>
  );
};

export const ConfirmDeleteSelectionDialog = ({ selected_items, onDelete, onClose }) => {
  return (
    <div className="view-album-selection-dialog">
      <div>
        <div className="view-album-selection-dialog-title">
          DELETE {selected_items.length} SELECTED ITEMS?
        </div>
        <div className="view-album-selection-dialog-text">
          THIS CANNOT BE UNDONE
        </div>
        <div className="view-album-selection-dialog-buttons">
          <c.DangerButtonSm autoFocus title="DELETE" onClick={onDelete} />
          <c.WhiteButtonSm title="CANCEL" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export const MovingDialog = ({ key, global, onCancel }) => {
  const className = ('view-album-photo-thumb-dialog'
    + (global ? ' thumb-dialog-position-global' : ''));

  return (
    <>
      <div id={key} key={key} className={className}>
        <div className="view-album-photo-thumb-dialog-title">
          CLICK ON A
          {' '}
          <span style={{ padding: '0 0.5rem' }}>
            <icon.MountainFourArrows width="2rem" height="2rem" />
          </span> ICON
          <br />
          TO MOVE THIS IMAGE
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <c.WhiteButtonSm title="CANCEL" onClick={onCancel} />
        </div>
      </div>
    </>
  );
};
