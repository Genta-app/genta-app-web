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

/* eslint-disable no-mixed-operators */
/* eslint-disable react/jsx-one-expression-per-line */

import React, { useState } from 'react';
import { Redirect, Link } from 'react-router-dom';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';

import { apiConfirmEmail } from '../library/Api';

import { packValue } from '../library/Pack';

export const LogoutPage = ({ app, user }) => {
  const authenticated = user.getAuth();

  if (authenticated) {
    app.logoutUser(true);
  }

  return (
    <>
      { authenticated && (
        <div style={{ margin: '5rem auto', textAlign: 'center' }}>
          <h4>Logging out...</h4>
        </div>
      )}
      { authenticated || (
        <div style={{ margin: '5rem auto', textAlign: 'center' }}>
          <h4>Logged out. <Link to="/index.html">Go to Main Page</Link></h4>
        </div>
      )}
    </>
  );
};

async function handleConfirmEmail(user, code, setSpinner, setConfFailed) {
  const pack = packValue({ code });
  const xhr = await apiConfirmEmail(pack);
  if (xhr.status === 200) {
    user.setEmailVerified('1');
  } else {
    setConfFailed(true);
  }
  setSpinner(false);
}

// async function handleResendConfirmation(setSpinner, setResendFailed) {
//   const pack = packValue({resend: true});
//   const xhr = await apiConfirmEmail(pack);
//   return xhr.status === 200;
// }

async function handleLogin(email, password, app, setLoginFailed, setSpinner) {
  const success = await app.loginUser(email, password);
  setSpinner(false);
  if (!success) {
    setLoginFailed(true);
  }
}

function emailConfirmationForm(
  user,
  code,
  setCode,
  conf_failed,
  setConfFailed,
  resend_failed,
  setResendFailed,
  conf_spinner,
  setConfSpinner,
  resend_spinner,
  setResendSpinner
) {
  const onConfirmButtonClick = () => {
    setConfSpinner(true);
    setResendSpinner(false);
    setResendFailed(false);
    setConfFailed(false);
    setTimeout(() => handleConfirmEmail(user, code, setConfSpinner, setConfFailed), 100);
  };

  return (
    <c.Form title="Email Confirmation">
      <c.StaticText>
        We have sent you a message to
      </c.StaticText>

      <c.StaticText style={{ marginTop: '0.5rem', color: '#ddd' }}>
        <b>{user.getEmail()}</b>
      </c.StaticText>

      <c.StaticText style={{ marginTop: '0.5rem' }}>
        Please check your inbox and click the confirmation link or
        enter below the code from the message
      </c.StaticText>

      <c.TextInput
        test_id="text_confirmation"
        value={code}
        onChange={ev => setCode(ev.target.value)}
        red_text={conf_failed ? 'CODE IS NOT VALID' : ''}
        placeholder="CONFIRMATION CODE"
      />

      <c.SuperWhiteButton
        disabled={conf_spinner || resend_spinner}
        onClick={onConfirmButtonClick}
        title={conf_spinner ? 'PLEASE WAIT...' : 'CONFIRM'}
      />

      <c.WhiteButton
        disabled={conf_spinner || resend_spinner}
        onClick={false}
        title={resend_spinner ? 'PLEASE WAIT...' : 'RESEND CODE'}
      />
    </c.Form>
  );
}

export const LoginPage = ({ app, user }) => {
  const [login_failed, setLoginFailed] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password_clear, setPasswordClear] = useState(false);
  const [spinner, setSpinner] = useState(false);

  // these two are for email confirmation form only
  const [conf_spinner, setConfSpinner] = useState(false);
  const [resend_spinner, setResendSpinner] = useState(false);

  const [code, setCode] = useState('');
  const [conf_failed, setConfFailed] = useState(false);
  const [resend_failed, setResendFailed] = useState(false);

  const onLoginButtonClick = () => {
    setSpinner(true);
    setLoginFailed(false);
    setTimeout(() => handleLogin(
      username.trim().toLowerCase(), password, app, setLoginFailed, setSpinner
    ), 100);
  };

  if (user.getAuth()) {
    if (user.getEmailVerified() !== '1') {
      return emailConfirmationForm(user, code, setCode, conf_failed,
        setConfFailed, resend_failed, setResendFailed,
        conf_spinner, setConfSpinner, resend_spinner, setResendSpinner);
    }

    let redirect_target;

    if (user.isViewer() || user.isTrial() && !user.isExpiredTrial() || user.isPaid()) {
      redirect_target = '/view';
    } else {
      redirect_target = '/sub';
    }

    return <Redirect to={redirect_target} />;
  }

  const passwordIcon = (password_clear
    ? <icon.IconEyeSlash onClick={() => setPasswordClear(!password_clear)} />
    : <icon.IconEye onClick={() => setPasswordClear(!password_clear)} />
  );

  return (
    <c.Form title="Login">
      <c.TextInput
        test_id="email"
        value={username}
        onChange={(ev) => { setUsername(ev.target.value); }}
        icon={icon.icon_envelope}
        placeholder="EMAIL ADDRESS"
      />
      <c.PasswordInput
        test_id="pass"
        value={password}
        clear={password_clear}
        back_icon={passwordIcon}
        onChange={(ev) => {
          setPassword(ev.target.value);
          setPasswordClear(false);
        }}
        red_text={login_failed ? 'INVALID EMAIL OR PASSWORD' : ''}
        icon={icon.icon_lock}
        placeholder="PASSWORD"
      />
      <c.WhiteButton
        disabled={spinner}
        onClick={() => onLoginButtonClick(username, password)}
        title={spinner ? 'LOGGING IN. PLEASE WAIT...' : 'LOG IN'}
      />

      <div className="form-text">
        Have no account? <a href="/signup"><b>Sign Up</b></a>
      </div>
    </c.Form>
  );
};
