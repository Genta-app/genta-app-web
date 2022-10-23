/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

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

import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';

import * as icon from '../../components/Icons';
import * as c from '../../components/Controls';
import { If } from '../../components/JSXFlow';
import { packValue } from '../../library/Pack';
import { attachBucket } from '../../library/Api';

const handleAttachExistingBucketClick = async (
  app,
  user,
  input_bucket_name,
  input_bucket_id,
  input_bucket_key_id,
  input_bucket_key,
  input_bucket_prefix,
  cors_autoconfig_checked,
) => {
  const bucket_service = 'backblaze-b2';

  const pack = packValue({
    bucket_service,
    operation_type: 'attach-existing',
    bucket_name: input_bucket_name,
    bucket_prefix: input_bucket_prefix,
    bucket_id: input_bucket_id,
    bucket_key_id: input_bucket_key_id,
    bucket_key: input_bucket_key,
    cors_autoconfig: cors_autoconfig_checked ? 1 : 0,
  });

  const xhr = await attachBucket(pack);
  if (xhr.status === 200) {
    await app.loadBucketList(user);
    return { success: true, error_hint: null };
  }
  if (xhr.status === 400 && xhr.response === 'bucket authorization failed') {
    return {
      success: false,
      error_hint: 'Bucket authorization failed. BUCKET KEY ID and/or BUCKET KEY values are invalid',
    };
  }
  if (xhr.status === 400 && xhr.response === 'invalid bucket id') {
    return {
      success: false,
      error_hint: 'Bucket ID is invalid',
    };
  }
  if (xhr.status === 400 && xhr.response.startsWith('invalid cors settings')) {
    const msg = `CORS error: ${xhr.response}`;
    return {
      success: false,
      error_hint: (
        <>
          <div>{msg}</div>
          <div>
            Please refer to the storage configuration
            {' '}
            <Link style={{ color: '#FC55FF' }} to="/doc/attach-backblaze-storage">
              <b>documentation</b>
            </Link>
          </div>
        </>
      ),
    };
  }

  return { success: false, error_hint: 'Unknown error' };
};

export const AttachBucket = () => {
  const history = useHistory();

  return (
    <div className="main-form">
      <div className="form-title" style={{ marginBottom: '6rem' }}>Attach Storage</div>

      <c.StaticText>
        <b>Genta.app</b> can automatically create, configure and attach a new
        storage bucket under your Backblaze B2 account
      </c.StaticText>

      <c.WhiteButton
        style={{ marginTop: '2rem', marginBottom: '6rem' }}
        onClick={() => history.push('/storage/attach/create')}
        title="CREATE AND ATTACH"
      />

      <c.StaticText>
        You can attach an existing storage bucket. Please make sure the bucket
        is configured as described in the
        {' '}
        <Link to="/doc/attach-backblaze-storage">
          <b>Genta.app</b> attach storage guide
        </Link>.
      </c.StaticText>

      <c.WhiteButton
        style={{ marginTop: '2rem' }}
        onClick={() => history.push('/storage/attach/existing')}
        title="ATTACH EXISTING"
      />
    </div>
  );
};

export const AttachExistingBucket = ({ app, user }) => {
  const history = useHistory();
  const storage_provider_list = [{ label: 'BACKBLAZE B2' }];

  const [password_clear, setPasswordClear] = useState(false);
  const [provider_list_open, setProviderListOpen] = useState(false);
  const [attach_bucket_error_hint, setAttachBucketErrorHint] = useState(null);
  const [in_progress, setInProgress] = useState(false);

  const [input_bucket_name, setInputBucketName] = useState('');
  const [input_bucket_id, setInputBucketId] = useState('');
  const [input_bucket_key_id, setInputBucketKeyId] = useState('');
  const [input_bucket_key, setInputBucketKey] = useState('');
  const [input_bucket_prefix, setInputBucketPrefix] = useState('');

  const [error_invalid_bucket_name, setErrorInvalidBucketName] = useState(false);
  const [error_invalid_bucket_id, setErrorInvalidBucketId] = useState(false);
  const [error_invalid_access_key_id, setErrorInvalidAccessKeyId] = useState(false);
  const [error_invalid_access_key, setErrorInvalidAccessKey] = useState(false);

  const password_icon = (password_clear
    ? <icon.IconEyeSlash onClick={() => setPasswordClear(!password_clear)} />
    : <icon.IconEye onClick={() => setPasswordClear(!password_clear)} />
  );

  const validateInput = () => {
    let retval = true;

    setErrorInvalidBucketName(false);
    setErrorInvalidBucketId(false);
    setErrorInvalidAccessKeyId(false);
    setErrorInvalidAccessKey(false);

    if (input_bucket_name.length === 0) {
      setErrorInvalidBucketName(true);
      retval = false;
    }
    if (input_bucket_id.length === 0) {
      setErrorInvalidBucketId(true);
      retval = false;
    }
    if (input_bucket_key_id.length === 0) {
      setErrorInvalidAccessKeyId(true);
      retval = false;
    }
    if (input_bucket_key.length === 0) {
      setErrorInvalidAccessKey(true);
      retval = false;
    }
    return retval;
  };

  return (
    <>
      <div className="main-form">
        <div className="form-title">Attach Existing</div>

        <c.DropdownList
          onClick={() => setProviderListOpen(!provider_list_open)}
          open={provider_list_open}
          label="STORAGE PROVIDER"
          items={storage_provider_list}
          value={storage_provider_list[0].label}
        />
        <c.TextInput
          label="BUCKET NAME"
          value={input_bucket_name}
          red_text={error_invalid_bucket_name && 'Please enter a bucket name'}
          onChange={ev => setInputBucketName(ev.target.value)}
          placeholder="AN EXISTING BUCKET NAME"
        />
        <c.TextInput
          label="BUCKET ID"
          value={input_bucket_id}
          red_text={error_invalid_bucket_id && 'Please enter a bucket ID'}
          onChange={ev => setInputBucketId(ev.target.value)}
          placeholder="BUCKET ID"
        />
        <c.TextInput
          label="BUCKET KEY ID"
          value={input_bucket_key_id}
          red_text={error_invalid_access_key_id && 'Please enter a bucket key ID'}
          onChange={ev => setInputBucketKeyId(ev.target.value)}
          placeholder="BUCKET ACCESS KEY ID"
        />
        <c.PasswordInput
          label="BUCKET KEY"
          value={input_bucket_key}
          red_text={error_invalid_access_key && 'Please enter a bucket key'}
          onChange={ev => setInputBucketKey(ev.target.value)}
          clear={password_clear}
          back_icon={password_icon}
          placeholder="BUCKET ACCESS KEY"
        />
        <c.TextInput
          label="BUCKET PATH PREFIX (OPTIONAL)"
          value={input_bucket_prefix}
          onChange={ev => setInputBucketPrefix(ev.target.value)}
          placeholder="OBJECT PREFIX TO USE"
        />
        {/* <c.Checkbox
            checked={cors_autoconfig_checked}
            onClick={ev => this.setState({cors_autoconfig_checked: ev.target.checked})}
            label="AUTO CONFIGURE BUCKET CORS">auto configure bucket CORS</c.Checkbox> */
        }

        <If condition={attach_bucket_error_hint != null}>
          <c.StaticText style={{ color: '#FC55FF' }}> {/* defs.color_test_warning */}
            {attach_bucket_error_hint}
          </c.StaticText>
        </If>

        <c.SuperWhiteButton
          onClick={() => {
            setAttachBucketErrorHint(null);
            if (!validateInput()) {
              return;
            }
            setInProgress(true);
            setTimeout(async () => {
              const { success, error_hint } = await handleAttachExistingBucketClick(
                app,
                user,
                input_bucket_name,
                input_bucket_id,
                input_bucket_key_id,
                input_bucket_key,
                input_bucket_prefix,
                false,
              );
              setInProgress(false);
              if (success) {
                history.push('/storage/attach/success');
                return;
              }
              setAttachBucketErrorHint(error_hint);
            }, 100);
          }}
          disabled={in_progress}
          title={in_progress ? 'PLEASE WAIT...' : 'ATTACH STORAGE'}
        />
        <c.WhiteButton
          style={{ marginTop: '1rem' }}
          onClick={() => {
            history.push('/storage');
          }}
          title="CANCEL"
        />
      </div>
    </>
  );
};
