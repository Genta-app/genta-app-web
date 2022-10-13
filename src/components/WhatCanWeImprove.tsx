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

/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/jsx-one-expression-per-line */

// @ts-ignore
import React, { useState } from 'react';
import * as c from './Controls';
import * as api from '../library/Api';
import { IconChevron, HandThumbsUp } from './Icons';

enum State {
    Input,
    Confirmation,
}

export const WhatCanWeImproveButton = (props) => {
  const { app } = props;

  return (
    <c.ButtonBase
      {...props}
      onClick={() => app.setShowFeedbackDialog(true)}
      title={<>WHAT CAN WE IMPROVE? <IconChevron style={{}} width="1.25rem" height="1.25rem" /></>}
      className="square-button"
    />
  );
};

export const WhatCanWeImproveMenuItem = (props) => {
  const { app } = props;

  return (
    <div
      className="what-can-we-improve-menu-item"
      onClick={() => { props.app.setShowSideMenu(false); app.setShowFeedbackDialog(true); }}
    >
      <HandThumbsUp width="1.8rem" height="1.8rem" /> WHAT CAN WE IMPROVE?
    </div>
  );
};

const WhatCanWeImproveConfirmation = ({ onClose }) => (
  <div className="what-can-we-improve-dialog-wrapper">
    <div className="what-can-we-improve-confirmation">
      <div>THANK YOU FOR THE FEEDBACK!</div>
      <div>
        <c.SuperWhiteButtonSm
          onClick={onClose}
          title="CLOSE"
          style={{ height: '1.75rem', fontSize: '0.9rem', margin: 0 }}
        />=
      </div>
    </div>
  </div>
);

const WhatCanWeImproveInput = (props) => {
  const {
    onSubmit,
    setMessage,
    message,
    setError,
    error,
    app,
  } = props;

  const onClose = (ev) => {
    if (ev.target.className === 'what-can-we-improve-dialog-wrapper') {
      app.setShowFeedbackDialog(false);
    }
  };

  const max_size = 8192; // max message length, chars

  return (
    <div className="what-can-we-improve-dialog-wrapper" onClick={onClose}>
      <div className="what-can-we-improve-dialog">
        <div>YOUR MESSAGE</div>
        <div style={{ position: 'relative' }}>
          <textarea
            onChange={(ev) => {
              setMessage(ev.target.value.substring(0, max_size)); setError(false);
            }}
            value={message}
          />
          {error && <div className="redtext">Error sending your message. Please try again later</div>}
        </div>
        <div>
          <div style={{ fontWeight: 'normal' }}>{`${max_size - message.length} chars left`}</div>
          <c.SuperWhiteButtonSm
            disabled={message.length === 0}
            onClick={onSubmit}
            title="SUBMIT"
            style={{ height: '1.75rem', fontSize: '0.9rem', margin: 0 }}
          />
        </div>
      </div>
    </div>
  );
};

export const WhatCanWeImproveDialog = (props) => {
  const { user } = props;

  const [state, setState] = useState(State.Input);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const onSubmit = async () => {
    const status = await api.apiPostFeedback(user && user.getAuth() ? user.getEmail() : '', message);
    if (status === 200) {
      setMessage('');
      setError(false);
      setState(State.Confirmation);
    } else {
      setError(true);
    }
  };

  switch (state) {
    case State.Input:
      return (
        <WhatCanWeImproveInput
          {...props}
          {...{
            setState, onSubmit, message, setMessage, error, setError
          }}
        />
      );
    case State.Confirmation:
      return (
        <WhatCanWeImproveConfirmation
          {...props}
          onClose={() => props.app.setShowFeedbackDialog(false)}
        />
      );
    default:
      return <></>;
  }
};
