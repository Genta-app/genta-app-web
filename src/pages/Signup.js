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

import React, { useState, } from 'react';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';

import { apiUserCreate } from '../library/Api';
import { ACCOUNT_TYPE_FREE, ACCOUNT_TYPE_STANDARD } from '../library/User';
import { packValue } from '../library/Pack';
import * as crypto from '../library/Crypto';

import { validateEmail } from '../library/Format';

async function onSignup(
  app,
  email_text,
  email_code,
  password,
  user,
  account_type,
  setDuplicateEmail,
  setSignupError,
  setSpinner
) {
  const email = new Uint8Array(Buffer.from(email_text));

  const auth_hash = crypto.deriveAuthKey(email, password);
  // master key is never stored, always derived from password on client
  const master_key = crypto.deriveMasterKey(email, password);

  const [private_key, public_key] = crypto.generateKeys();
  const encrypted_private_key = crypto.symmetricEncrypt(master_key, private_key);

  let pack = {
    user: {
      account_type,
      email,
      email_code,
      auth: auth_hash,
      encrypted_private_key,
      public_key,
    },
  };

  if (account_type === ACCOUNT_TYPE_STANDARD) {
    const album_key = crypto.symmetricGenerateKey();
    const encrypted_album_key = crypto.cryptoBox(private_key, public_key, album_key);

    const encrypted_album_data = crypto.symmetricEncrypt(
      album_key,
      packValue({
        album: {
          name: 'Timeline',
        }
      })
    );

    pack.album = {
      encrypted_album_key,
      encrypted_album_data,
    };
  }

  pack = packValue(pack);

  /*
    // let's make sure we can get back the keys
    const unpacker = new Packer();
    unpacker.fromArray(pack);

    assert.strict.deepEqual(["mail", "auth", "uprk", "upuk"], unpacker.names);

    assert.strict.deepEqual(
        [email, auth_hash, encrypted_private_key, public_key],
        unpacker.items);

    const decrypted_private_key = crypto.symmetricDecrypt(master_key, encrypted_private_key);
    assert.strict.deepEqual(private_key, decrypted_private_key);

    // all good, save to server
    */

  const xhr = await apiUserCreate(pack);
  if (xhr.status === 200) {
    await app.loginUser(email_text, password);

    // this will reload the page and flush any previously
    // saved user info, forcing user to login
    window.location = '/login';
  } else if (xhr.status === 409) {
    setSpinner(false);
    setDuplicateEmail(true);
  } else {
    setSpinner(false);
    setSignupError(true);
  }
}

const SignupDetails = ({
  match,
  app,
  user,
  account_type,
  // setUser
}) => {
  const email = (match && match.params) ? decodeURIComponent(match.params.email) : '';
  const email_code = (match && match.params) ? decodeURIComponent(match.params.email_code) : '';

  const [username, setUsername] = useState(email);
  const [email_invalid, setEmailInvalid] = useState(false);
  const [email_duplicate, setEmailDuplicate] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [password_clear, setPasswordClear] = useState(false);
  const [password_mismatch, setPasswordMismatch] = useState(false);
  const [password_empty, setPasswordEmpty] = useState(false);
  const [spinner, setSpinner] = useState(false);
  const [terms_accepted, setTermsAccepted] = useState(false);
  const [need_accept_terms, setNeedAcceptTerms] = useState(false);
  const [signup_error, setSignupError] = useState(false);

  const passwordIcon = password_clear
    ? <icon.IconEyeSlash onClick={() => setPasswordClear(!password_clear)} />
    : <icon.IconEye onClick={() => setPasswordClear(!password_clear)} />;

  const onSignupButtonClick = () => {
    if (!validateEmail(username.trim().toLowerCase())) {
      setEmailInvalid(true);
      return;
    }

    if (password !== password2) {
      setPasswordMismatch(true);
      return;
    }

    if (password.length === 0) {
      setPasswordEmpty(true);
      return;
    }

    if (!terms_accepted) {
      setNeedAcceptTerms(true);
      return;
    }

    setSpinner(true);
    setTimeout(() => onSignup(
      app,
      username.trim().toLowerCase(),
      email_code,
      password,
      user,
      account_type,
      setEmailDuplicate,
      setSignupError,
      setSpinner
    ), 100);
  };


  let email_red_text = '';
  if (email_invalid) {
    email_red_text = 'INVALID EMAIL';
  }
  if (email_duplicate) {
    email_red_text = 'EMAIL ALREADY REGISTERED';
  }

  let password_red_text = '';
  if (password_mismatch) {
    password_red_text = 'PASSWORDS DO NOT MATCH';
  }
  if (password_empty) {
    password_red_text = 'PLEASE PROVIDE A PASSWORD';
  }

  if (signup_error) {
    return (
      <>
        <div className="main2">
          <div className="left-panel-with-logo">
            <div className="left-panel-logo">genta.app</div>
          </div>
          <div>
            <div className="main-form-error">
              <div className="form-title-error">Error</div>
              <c.StaticText style={{ margin: '1rem 0 15rem 0' }}>
                Signup failed. Please try again later
              </c.StaticText>
              <c.StaticText />

              <c.PrimaryButton
                onClick={() => setSignupError(false)}
                title="BACK"
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <c.Form title="Sign Up">
      <c.TextInput
        test_id="email"
        value={username}
        onChange={(ev) => {
          setUsername(ev.target.value);
          setEmailInvalid(false);
        }}
        icon={icon.icon_envelope}
        red_text={email_red_text}
        placeholder="EMAIL ADDRESS"
      />
      <c.PasswordInput
        test_id="pass1"
        value={password}
        clear={password_clear}
        back_icon={passwordIcon}
        onChange={(ev) => {
          setPassword(ev.target.value);
          setPasswordMismatch(false);
          setPasswordEmpty(false);
        }}
        icon={icon.icon_lock}
        placeholder="PASSWORD"
      />
      <c.PasswordInput
        test_id="pass2"
        value={password2}
        clear={password_clear}
        back_icon={passwordIcon}
        onChange={(ev) => {
          setPassword2(ev.target.value);
          setPasswordMismatch(false);
          setPasswordEmpty(false);
        }}
        red_text={password_red_text}
        icon={icon.icon_lock}
        placeholder="REPEAT PASSWORD"
      />


      <c.StaticText margin style={{ marginTop: '2rem' }}>
        We strongly recommend to backup your password on a reliable
        external medium, outside this computer.
        If you lose your password, you may not be able to access your data
      </c.StaticText>

      <c.Checkbox
        test_id="accept-terms"
        checked={terms_accepted}
        red_text={need_accept_terms ? 'PLEASE READ AND ACCEPT T&C' : ''}
        onClick={(ev) => {
          setTermsAccepted(ev.target.checked);
          setNeedAcceptTerms(false); // no need to show the prompt
        }}
      >
        I have read and accept
        {' '}
        <a
          href="/doc/tos"
        >
          Terms&nbsp;of&nbsp;Service
        </a>
        ,
        {' '}
        <a
          href="/doc/privacy-policy"
        >
          Privacy&nbsp;Policy
        </a>
      </c.Checkbox>

      <c.WhiteButton
        disabled={spinner}
        onClick={() => onSignupButtonClick(email, password)}
        title={spinner ? 'SIGNING UP. PLEASE WAIT...' : 'SIGN UP'}
      />

      <div style={{ marginTop: '5rem' }}>&nbsp;</div>
    </c.Form>
  );
};

export const SignupChooseAccountType = ({
  onContinue, upgrade, account_type, setAccountType
}) => {
  const title = upgrade ? 'Upgrade Account' : 'Choose Account Type';

  return (
    <>
      <h1 className="account-selection-header">{title}</h1>

      <div className="account-selection-section">

        <div className={`account-type-box ${
          account_type === ACCOUNT_TYPE_FREE ? 'account-type-box-selected' : ''
        }`}
        >
          <div className="account-type-name">
            FREE
          </div>

          <div className="account-type-price-box" />

          <div className="account-feature-list">
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              A
              <span>lways free</span>
            </div>
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              A
              <span>ccess shared albums</span>
            </div>
          </div>
          <div
            className="account-type-checkbox"
            onClick={upgrade ? undefined : () => setAccountType(ACCOUNT_TYPE_FREE)}
          >
            {account_type === ACCOUNT_TYPE_FREE && (
              <icon.IconCheck width="2.5rem" height="2.5rem" />
            )}
          </div>
        </div>

        <div
          className={`account-type-box ${
            account_type === ACCOUNT_TYPE_STANDARD ? 'account-type-box-selected' : ''
          }`}
        >
          <div className="account-type-name">
            STANDARD
          </div>

          <div className="account-type-price-box">
            <div>$</div>
            <div>0.99</div>
            <div>
              USD per
              <br />
              month
            </div>
          </div>

          <div className="account-feature-list">
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              F
              <span>irst 3 months free</span>
            </div>
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              E
              <span>nd-to-end encryption</span>
            </div>
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              P
              <span>rogressive pricing</span>
            </div>
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              U
              <span>ncapped storage</span>
            </div>
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              U
              <span>nlimited album sharing</span>
            </div>
            <div className="account-type-feature">
              <span className="account-type-dot">&#10004;</span>
              {' '}
              U
              <span>nlimited album editors</span>
            </div>
          </div>

          {upgrade && (
          <c.WhiteButton
            style={{ margin: '4rem auto', width: '75%' }}
            onClick={onContinue}
            title="UPGRADE"
          />
          )}

          {!upgrade && (
            <div
              className="account-type-checkbox"
              onClick={() => setAccountType(ACCOUNT_TYPE_STANDARD)}
            >
              {account_type === ACCOUNT_TYPE_STANDARD && (
                <icon.IconCheck width="2.5rem" height="2.5rem" />
              )}
            </div>
          )}
        </div>
      </div>

      {!upgrade && (
      <c.WhiteButton
        style={{ margin: '0 auto' }}
        onClick={onContinue}
        title="CONTINUE"
      />
      )}

    </>
  );
};

// eslint-disable-next-line consistent-return
export const SignupPage = (props) => {
  const [step, setStep] = useState(1);
  const [account_type, setAccountType] = useState(ACCOUNT_TYPE_STANDARD);

  // eslint-disable-next-line default-case
  switch (step) {
    case 1:
      return (
        <SignupChooseAccountType
          {...props}
          account_type={account_type}
          setAccountType={setAccountType}
          onContinue={() => setStep(2)}
        />
      );
    case 2:
      return <SignupDetails {...props} account_type={account_type} setStep={setStep} />;
  }
};
