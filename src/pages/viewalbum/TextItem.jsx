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
/* eslint-disable no-unused-expressions */
/* eslint-disable no-else-return */
/* eslint-disable no-shadow */
/* eslint-disable react/jsx-boolean-value */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable class-methods-use-this */

import React from 'react';
import ReactMarkdown from 'react-markdown';

import * as c from '../../components/Controls';
import * as icon from '../../components/Icons';

export class TextItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  renderText(text) {
    return text; // .split("\n").map((t, index) => <p key={index}>{t || <>&nbsp;</>}</p>);
  }

  renderStaticSelection(page, item) {
    return (
      <div
        onClick={(ev) => {
          ev.stopPropagation();
          page.handleItemSelectClick(item);
        }}
        style={{ position: 'absolute', width: '1.75rem', backgroundColor: '#363a46' }}
      >
        <icon.CircleThumbSelectCheck width="1.5rem" height="1.5rem" />
      </div>
    );
  }

  render() {
    const {
      item,
      page,
      edit,
      onEdit,
      onCancelEdit,
      selected
    } = this.props;
    const key = item.getFileIdentifier();
    const text = item.getComment();

    const can_delete = item.getCanDeleteFile() === 1;
    const can_edit = item.getCanEditFile() === 1;

    if (edit) {
      return (
        <div className="view-album-paragraph">
          {/* <i><small>enter text or commonmark</small></i> */}
          <c.ParagraphEdit
            can_select={true}
            selected={selected}
            can_delete={can_delete}
            value={text}
            onSelected={() => page.handleItemSelectClick(item)}
            onSave={async (text) => { await page.handleSaveText(item, text); }}
            onCancel={() => onCancelEdit(item)}
          />
        </div>
      );
    } else {
      return (
        <div
          key={key}
          onClick={() => { can_edit && onEdit(item); }}
          className="view-album-paragraph"
        >
          {selected && this.renderStaticSelection(page, item)}
          <ReactMarkdown>{this.renderText(text)}</ReactMarkdown>
        </div>
      );
    }
  }
}
