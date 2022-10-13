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
/* eslint-disable react/jsx-one-expression-per-line */

import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';
import * as api from '../library/Api';

import { packValue } from '../library/Pack';

import { validateEmail } from '../library/Format';

import { ganalytics, useGentaAnalyticsOnce } from '../library/GentaAnalytics';

async function onApply(
  email_text,
  setSpinner,
  setSignupSuccess,
  setSignupError
) {
  const email = new Uint8Array(Buffer.from(email_text));

  const pack = packValue({
    email,
  });

  const xhr = await api.userApply(pack);

  setSpinner(false);

  if (xhr.status === 200) {
    setSignupSuccess(true);
    setSignupError(false);
  } else {
    setSignupSuccess(false);
    setSignupError(true);
  }
}

// eslint-disable-next-line no-unused-vars
export const ApplyForInvitePage = ({ match, app, user }) => {
  useGentaAnalyticsOnce(() => ganalytics.page());

  const email = (match && match.params) ? decodeURIComponent(match.params.email) : '';

  const hist = useHistory();
  const [username, setUsername] = useState(email);
  const [email_invalid, setEmailInvalid] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [signup_success, setSignupSuccess] = useState(false);
  const [signup_error, setSignupError] = useState(false);

  const onSignupButtonClick = () => {
    if (!validateEmail(username.trim().toLowerCase())) {
      setEmailInvalid(true);
      return;
    }

    setSpinner(true);
    setTimeout(() => onApply(
      username.trim().toLowerCase(),
      setSpinner,
      setSignupSuccess,
      setSignupError,
    ), 100);
  };


  let email_red_text = '';
  if (email_invalid) {
    email_red_text = 'INVALID EMAIL';
  }

  if (signup_success) {
    return (
      <c.Form title="Apply for Invite">
        <c.StaticText>
          Thank you for your interest in <b>Genta.app</b>. Your sign up link will
          be sent to <b>{username}</b>.
        </c.StaticText>

        <c.WhiteButton
          disabled={spinner}
          onClick={() => hist.push('/')}
          title="BACK TO MAIN PAGE"
        />
      </c.Form>
    );
  }

  if (signup_error) {
    return (
      <c.Form title="Apply for Invite">
        <c.StaticText>
          Hmm... Looks like something went wrong.
          <br /><br />We are sorry. Please try again later
        </c.StaticText>

        <c.WhiteButton
          disabled={spinner}
          onClick={() => setSignupError(false)}
          title="BACK"
        />
      </c.Form>
    );
  }

  return (
    <c.Form title="Apply for Invite">
      <c.TextInput
        test_id="email"
        value={username}
        onChange={(ev) => { setUsername(ev.target.value); setEmailInvalid(false); }}
        icon={icon.icon_envelope}
        red_text={email_red_text}
        placeholder="EMAIL ADDRESS"
      />
      <c.StaticText>
        We temporarily restrict user registration to ensure
        platform reliability and best user expirience.

        <br /><br />The invite should arrive to your inbox within few hours
        but sometimes could take a bit longer.

        <br /><br />Thank you for your interest in <b>Genta.app</b>.
      </c.StaticText>

      <c.WhiteButton
        disabled={spinner}
        onClick={onSignupButtonClick}
        title={spinner ? 'PLEASE WAIT...' : 'APPLY'}
      />
      <div className="form-text">
        Have an account? <Link to="/login"><b>Log In</b></Link>
      </div>
    </c.Form>
  );
};
