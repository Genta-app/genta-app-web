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
import { unpackValue, packValue } from '../../library/Pack';
import { attachBucket, apiGetTask } from '../../library/Api';

const handleAttachNewBucketClick = async (
  app,
  user,
  input_master_key_id,
  input_master_key,
) => {
  const bucket_service = 'backblaze-b2';

  const pack = packValue({
    bucket_service,
    operation_type: 'attach-new',
    master_key_id: input_master_key_id,
    master_key: input_master_key,
  });

  let xhr = await attachBucket(pack);

  if (xhr.status === 200) {
    // the bucket is being created on the background
    const { task_id } = unpackValue(xhr.response);

    let task_status;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 1500));

      // eslint-disable-next-line no-await-in-loop
      xhr = await apiGetTask(task_id);
      if (xhr.status !== 200) {
        break;
      }

      task_status = unpackValue(xhr.response).status;
      if (task_status !== 'pending') {
        break;
      }
    }

    if (task_status === 'complete') {
      await app.loadBucketList(user);
      return { success: true, error_hint: null };
    }
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

export const AttachNewBucket = ({ app, user }) => {
  const history = useHistory();
  const storage_provider_list = [{ label: 'BACKBLAZE B2' }];

  const [password_clear, setPasswordClear] = useState(false);
  const [provider_list_open, setProviderListOpen] = useState(false);
  const [attach_bucket_error_hint, setAttachBucketErrorHint] = useState(null);
  const [in_progress, setInProgress] = useState(false);

  const [input_master_key_id, setInputMasterKeyId] = useState('');
  const [input_master_key, setInputMasterKey] = useState('');

  const [error_invalid_master_key_id, setErrorInvalidMasterKeyId] = useState(false);
  const [error_invalid_master_key, setErrorInvalidMasterKey] = useState(false);

  const password_icon = (password_clear
    ? <icon.IconEyeSlash onClick={() => setPasswordClear(!password_clear)} />
    : <icon.IconEye onClick={() => setPasswordClear(!password_clear)} />
  );

  const validateInput = () => {
    let retval = true;

    setErrorInvalidMasterKeyId(false);
    setErrorInvalidMasterKey(false);

    if (input_master_key_id.length === 0) {
      setErrorInvalidMasterKeyId(true);
      retval = false;
    }
    if (input_master_key.length === 0) {
      setErrorInvalidMasterKey(true);
      retval = false;
    }
    return retval;
  };

  return (
    <>
      <div className="main-form">
        <div className="form-title">Attach New</div>

        <c.DropdownList
          onClick={() => setProviderListOpen(!provider_list_open)}
          open={provider_list_open}
          label="STORAGE PROVIDER"
          items={storage_provider_list}
          value={storage_provider_list[0].label}
        />
        <c.StaticText>
          <b>Genta.app</b> will use your Backblaze B2 master key to setup a
          new storage bucket and a new application key to access the storage under
          your Backblaze B2 account.
          <br />
          <br />
          <b>NOTE:</b> Your B2 master key will only be used for this setup operation.
          All storage access will be performed using the newly created application key.
        </c.StaticText>
        <c.TextInput
          label="MASTER KEY ID"
          value={input_master_key_id}
          red_text={error_invalid_master_key_id && 'Please enter your B2 master key ID'}
          onChange={ev => setInputMasterKeyId(ev.target.value)}
          placeholder="ACCOUNT MASTER KEY ID"
        />
        <c.PasswordInput
          label="MASTER KEY"
          value={input_master_key}
          red_text={error_invalid_master_key && 'Please enter B2 master key'}
          onChange={ev => setInputMasterKey(ev.target.value)}
          clear={password_clear}
          back_icon={password_icon}
          placeholder="MASTER KEY"
        />

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
              const { success, error_hint } = await handleAttachNewBucketClick(
                app,
                user,
                input_master_key_id,
                input_master_key,
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
          title={in_progress ? 'PLEASE WAIT...' : 'CREATE & ATTACH STORAGE'}
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
