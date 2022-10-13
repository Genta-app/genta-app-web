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
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import React from 'react';

import * as icon from '../../components/Icons';
import * as c from '../../components/Controls';

import {
  month_names,
} from '../../library/Format';


export const getDateHeaderId = (year, month, day) => `date-${year}-${month + 1}-${day}`;

export class DateHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show_menu: false,
    };
  }

  render() {
    const {
      d,
      reference,
      selected,
      handleSelectedClick
    } = this.props;
    const { show_menu } = this.state;

    const day = d.getDate();
    const month = month_names[d.getMonth()];
    const year = d.getFullYear();
    const id = getDateHeaderId(year, d.getMonth(), day);

    if (show_menu) {
      const ic = (selected
        ? <icon.CircleThumbSelectCheck width="1.5rem" height="1.5rem" />
        : <icon.CircleThumbSelect width="1.5rem" height="1.5rem" />);

      return (
        <div
          key={id}
          ref={reference}
          id={id}
          className="view-album-date"
          onMouseEnter={() => this.setState({ show_menu: true })}
          onMouseLeave={() => this.setState({ show_menu: false })}
        >
          <span style={{ position: 'relative', display: 'flex' }}>
            <span onClick={() => this.setState({ show_menu: true })}>
              {`${day} ${month}, ${year}`}
            </span>

            <c.MenuButton
              key={1}
              onClick={handleSelectedClick}
              noHover
              className="view-album-photo-date-select"
              icon={ic}
              title="Select All Items for Date"
            />
          </span>
        </div>
      );
    } else {
      return (
        <div
          key={id}
          ref={reference}
          id={id}
          className="view-album-date"
          onClick={() => this.setState({ show_menu: true })}
          onMouseEnter={() => this.setState({ show_menu: true })}
          onMouseLeave={() => this.setState({ show_menu: false })}
        >
          {`${day} ${month}, ${year}`}
        </div>
      );
    }
  }
}
