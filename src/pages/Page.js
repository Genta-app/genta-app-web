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
/* eslint-disable no-else-return */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable lines-between-class-members */

import React from 'react';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';

export class Page extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      alert_data: { text: '', icon: null },
    };

    this.timer_id = null;
  }

  setAlert = (alert_data) => {
    this.setState({ alert_data });
    if (this.timer_id != null) {
      clearTimeout(this.timer_id);
    }
    this.timer_id = setTimeout(() => this.resetAlert(), 5000);
  }

  setAlertError = (alert_text) => {
    this.setAlert({ text: alert_text, icon: <icon.IconExclCircle /> });
  }

  setAlertMessage = (alert_text) => {
    this.setAlert({ text: alert_text, icon: <icon.IconInfoCircle /> });
  }

  setStatePromise(dict_or_updater) {
    // eslint-disable-next-line no-unused-vars
    return new Promise(resolve => this.setState((state, props) => dict_or_updater, resolve));
  }

  resetAlert = () => {
    this.timer_id = null;
    this.setState({ alert_data: null });
  }

  renderAlert = () => {
    const { alert_data } = this.state;

    if (alert_data) {
      return (
        <c.Alert
          icon={alert_data.icon}
          text={alert_data.text}
          onClick={() => this.resetAlert()}
        />
      );
    } else {
      return <></>;
    }
  }

  setAlertFromResult = (result, success_text, error_text) => {
    if (result) {
      this.setAlert({ text: success_text, icon: null });
    } else {
      this.setAlert({ text: error_text, icon: <icon.IconExclCircle /> });
    }
  }
}
