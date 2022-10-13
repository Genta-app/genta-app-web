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
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable lines-between-class-members */

import React from 'react';

import { withRouter } from 'react-router';

import { Link } from 'react-router-dom';

import { packValue } from '../library/Pack';
import * as c from '../components/Controls';
import * as icon from '../components/Icons';
import * as m from '../components/Menu';
import { Page } from './Page';

import { attachBucket, detachBucket } from '../library/Api';


function BucketListItem({ bucket }) {
  const label_text = bucket.getBucketName();

  const label = (
    <Link
      to={`/storage/${bucket.getBucketIdentifier()}`}
      style={{ fontSize: '1rem', textDecoration: 'none' }}
    >
      {label_text}
    </Link>
  );

  return (
    <>
      <c.StaticText
        style={{ marginTop: '0', marginBottom: '3rem' }}
        label={label}
      >
        <div style={{ fontSize: '0.9rem' }}>
          {/* some info */}
        </div>
      </c.StaticText>
    </>
  );
}

function AlbumListItem({ album }) {
  const label_text = album.getAlbumName();

  const label = (
    <Link
      to={`/album/${album.getAlbumIdentifier()}`}
      style={{ fontSize: '1rem', textDecoration: 'none' }}
    >
      {label_text}
    </Link>
  );

  return (
    <>
      <c.StaticText
        style={{ marginTop: '0', marginBottom: '3rem' }}
        label={label}
      >
        <div style={{ fontSize: '0.9rem' }}>
          {/* some info */}
        </div>
      </c.StaticText>
    </>
  );
}

export class StoragePageComponent extends Page {
    PAGE_MODE_LIST = 1;
    PAGE_MODE_NEW_BUCKET = 2;
    PAGE_MODE_NEW_BUCKET_IN_PROGRESS = 3;
    PAGE_MODE_NEW_BUCKET_SUCCESS = 4;
    PAGE_MODE_NEW_BUCKET_ERROR = 5;
    PAGE_MODE_BUCKET = 6;
    PAGE_MODE_DETACH_BUCKET_PANEL = 7;
    PAGE_MODE_DETACH_BUCKET_SUCCESS = 8;
    PAGE_MODE_DETACH_BUCKET_ERROR = 9;
    PAGE_MODE_DETACH_BUCKET_IN_PROGRESS = 10;

    constructor(props) {
      super(props);

      this.state = {
        provider_list_open: false,
        password_clear: false,
        mode: null,
        bucket: null,
        input_bucket_name: '',
        input_bucket_id: '',
        input_bucket_prefix: '',
        input_bucket_key_id: '',
        input_bucket_key: '',
        error_invalid_bucket_name: false,
        error_invalid_bucket_id: false,
        error_invalid_access_key_id: false,
        error_invalid_access_key: false,
        attach_bucket_error_hint: null,
        cors_autoconfig_checked: false,
      };
    }

    resetStateOnSubmit() {
      this.setState({
        error_invalid_bucket_name: false,
        error_invalid_bucket_id: false,
        error_invalid_access_key_id: false,
        error_invalid_access_key: false,
        cors_autoconfig_checked: false,
      });
    }

    resetStateOnCancel() {
      this.setState({
        password_clear: false,
        input_bucket_name: '',
        input_bucket_id: '',
        input_bucket_prefix: '',
        input_bucket_key_id: '',
        input_bucket_key: '',
        error_invalid_bucket_name: false,
        error_invalid_bucket_id: false,
        error_invalid_access_key_id: false,
        error_invalid_access_key: false,
        attach_bucket_error_hint: null,
        cors_autoconfig_checked: false,
      });
    }

    setPageMode() {
      const { match } = this.props;
      const { bucket_ident } = match.params;

      if (bucket_ident === undefined) {
        this.setState({ mode: this.PAGE_MODE_LIST });
      } else if (bucket_ident === 'new') {
        this.setState({ mode: this.PAGE_MODE_NEW_BUCKET });
      } else {
        this.setState({ mode: this.PAGE_MODE_BUCKET });
      }
    }

    validateInput() {
      const {
        input_bucket_name,
        input_bucket_id,
        input_bucket_key_id,
        input_bucket_key,
      } = this.state;

      let retval = true;

      if (input_bucket_name.length === 0) {
        this.setState({ error_invalid_bucket_name: true });
        retval = false;
      }
      if (input_bucket_id.length === 0) {
        this.setState({ error_invalid_bucket_id: true });
        retval = false;
      }
      if (input_bucket_key_id.length === 0) {
        this.setState({ error_invalid_access_key_id: true });
        retval = false;
      }
      if (input_bucket_key.length === 0) {
        this.setState({ error_invalid_access_key: true });
        retval = false;
      }
      return retval;
    }


    componentDidMount() {
      this.setPageMode();
    }

    componentDidUpdate = (prevProps) => {
      const { user, match } = this.props;

      if (prevProps.user !== user || prevProps.match !== match) {
        this.setPageMode();
      }
    }

    // eslint-disable-next-line no-unused-vars
    handleProviderListClick = (el_type, value) => {
      const { provider_list_open } = this.state;
      this.setState({ provider_list_open: !provider_list_open });
    }

    handleAttachBucketClick = async () => {
      if (!this.validateInput()) {
        return;
      }

      const { app, user } = this.props;
      const bucket_service = 'backblaze-b2';

      const {
        input_bucket_name,
        input_bucket_id,
        input_bucket_prefix,
        input_bucket_key_id,
        input_bucket_key,
        cors_autoconfig_checked,
      } = this.state;

      const pack = packValue({
        bucket_service,
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
        // this.setState({bucket_list_key: Date.now()});
        this.setState({ mode: this.PAGE_MODE_NEW_BUCKET_SUCCESS });
        this.resetStateOnSubmit();
      } else if (xhr.status === 400 && xhr.response === 'bucket authorization failed') {
        this.setState(
          {
            attach_bucket_error_hint:
            'Bucket authorization failed. Please check that the BUCKET KEY ID and BUCKET KEY values are valid'
          }
        );
      } else if (xhr.status === 400 && xhr.response === 'invalid bucket id') {
        this.setState({ attach_bucket_error_hint: 'Bucket ID is invalid' });
      } else if (xhr.status === 400 && xhr.response.startsWith('invalid cors settings')) {
        const msg = `CORS error: ${xhr.response}`;
        this.setState({
          attach_bucket_error_hint: (
            <>
              <div>{msg}</div>
              <div>
                Please refer to the storage configuration <Link style={{ color: '#FC55FF' }} to=""><b>documentation</b></Link>
              </div>
            </>
          )
        });
        this.setState({ mode: this.PAGE_MODE_NEW_BUCKET });
      } else {
        // unknown error
        this.resetStateOnSubmit();
        this.setState({ mode: this.PAGE_MODE_NEW_BUCKET_ERROR });
      }
    }

    handleDetachBucketClick = async (bucket) => {
      const { app, user } = this.props;
      const xhr = await detachBucket(bucket);

      if (xhr.status === 200) {
        await app.loadBucketList(user);
        this.props.history.push('/storage');
        this.setState({ mode: this.PAGE_MODE_DETACH_BUCKET_SUCCESS });
      } else {
        this.setState({ mode: this.PAGE_MODE_DETACH_BUCKET_ERROR });
      }
    }

    // eslint-disable-next-line no-unused-vars
    renderNewBucketPanel = (bucket) => {
      const storage_provider_list = [{ label: 'BACKBLAZE B2' }];

      const {
        mode,
        provider_list_open,
        password_clear,
        input_bucket_name,
        input_bucket_id,
        input_bucket_prefix,
        input_bucket_key_id,
        input_bucket_key,
        error_invalid_bucket_name,
        error_invalid_bucket_id,
        error_invalid_access_key_id,
        error_invalid_access_key,
        attach_bucket_error_hint,
        // cors_autoconfig_checked,
      } = this.state;

      // eslint-disable-next-line no-shadow
      const setPasswordClear = password_clear => this.setState({ password_clear });

      const password_icon = (password_clear
        ? <icon.IconEyeSlash onClick={() => setPasswordClear(!password_clear)} />
        : <icon.IconEye onClick={() => setPasswordClear(!password_clear)} />
      );

      return (
        <>
          <div className="main-form">
            <div className="form-title">Attach New Storage</div>

            <c.DropdownList
              onClick={this.handleProviderListClick}
              open={provider_list_open}
              label="STORAGE PROVIDER"
              items={storage_provider_list}
              value={storage_provider_list[0].label}
            />
            <c.TextInput
              label="BUCKET NAME"
              value={input_bucket_name}
              red_text={error_invalid_bucket_name && 'Please enter a bucket name'}
              onChange={ev => this.setState({ input_bucket_name: ev.target.value })}
              placeholder="EXISTING BUCKET NAME"
            />
            <c.TextInput
              label="BUCKET ID"
              value={input_bucket_id}
              red_text={error_invalid_bucket_id && 'Please enter a bucket ID'}
              onChange={ev => this.setState({ input_bucket_id: ev.target.value })}
              placeholder="EXISTING BUCKET ID"
            />
            <c.TextInput
              label="BUCKET KEY ID"
              value={input_bucket_key_id}
              red_text={error_invalid_access_key_id && 'Please enter a bucket key ID'}
              onChange={ev => this.setState({ input_bucket_key_id: ev.target.value })}
              placeholder="BUCKET ACCESS KEY ID"
            />
            <c.PasswordInput
              label="BUCKET KEY"
              value={input_bucket_key}
              red_text={error_invalid_access_key && 'Please enter a bucket key'}
              onChange={ev => this.setState({ input_bucket_key: ev.target.value })}
              clear={password_clear}
              back_icon={password_icon}
              placeholder="BUCKET ACCESS KEY"
            />
            <c.TextInput
              label="BUCKET PATH PREFIX"
              value={input_bucket_prefix}
              onChange={ev => this.setState({ input_bucket_prefix: ev.target.value })}
              placeholder="OBJECT PREFIX TO USE"
            />
            {/* <c.Checkbox
                checked={cors_autoconfig_checked}
                onClick={ev => this.setState({cors_autoconfig_checked: ev.target.checked})}
                label="AUTO CONFIGURE BUCKET CORS">auto configure bucket CORS</c.Checkbox> */
            }

            {attach_bucket_error_hint != null && (
              <c.StaticText style={{ color: '#FC55FF' }}> {/* defs.color_test_warning */}
                {attach_bucket_error_hint}
              </c.StaticText>
            )}

            <c.SuperWhiteButton
              onClick={() => {
                this.setState({ mode: this.PAGE_MODE_NEW_BUCKET_IN_PROGRESS });
                setTimeout(this.handleAttachBucketClick, 100);
              }}
              disabled={mode === this.PAGE_MODE_NEW_BUCKET_IN_PROGRESS}
              title={
                mode === this.PAGE_MODE_NEW_BUCKET_IN_PROGRESS ? 'PLEASE WAIT...' : 'ATTACH BUCKET'
              }
            />
            <c.WhiteButton
              style={{ marginTop: '1rem' }}
              onClick={() => {
                this.resetStateOnCancel();
                this.setState({ mode: this.PAGE_MODE_LIST });
              }}
              title="CANCEL"
            />
          </div>
        </>
      );
    }

    renderBucketPanel = (buckets, bucket_ident) => {
      const { user } = this.props;

      const bucket0 = buckets.filter(b => b.getBucketIdentifier() === bucket_ident);

      if (bucket0.length === 0) {
        return (
          <>
            <div className="main-form">
              <div className="form-title">Bucket Not Found</div>
              <c.WhiteButton
                onClick={() => this.setState({ mode: this.PAGE_MODE_LIST })}
                title="BACK"
              />
            </div>
          </>
        );
      }

      const bucket = bucket0[0];
      const is_system = bucket.isSystemBucket();
      const service = is_system ? 'GENTA.APP' : bucket.getServiceName();
      const ident = bucket.getBucketIdentifier();
      const prefix = bucket.getBucketPrefix();

      return (
        <>
          <div className="main-form">
            <div className="form-title">Storage Details</div>

            <c.StaticText label="PROVIDER">
              { service }
            </c.StaticText>

            <c.StaticText label="LOCATION">
              { bucket.getBucketName() }
            </c.StaticText>

            {!is_system && (
              <c.StaticText label="BUCKET IDENTIFIER">
                { ident }
              </c.StaticText>
            )}

            {!is_system && (
              <c.StaticText label="BUCKET PREFIX">
                { prefix.length === 0 ? '(EMPTY)' : prefix }
              </c.StaticText>
            )}

            <c.StaticText label="DEFAULT">
              { user.getDefaultBucketIdent() === bucket.getBucketIdentifier() ? 'YES' : 'NO' }
            </c.StaticText>

            <c.WhiteButton
              onClick={() => {
                this.setState({ mode: this.PAGE_MODE_LIST });
                this.props.history.push('/storage');
              }}
              title="BACK"
            />

            {!bucket.isSystemBucket() && (
              <c.DangerButton
                style={{ marginTop: '1rem' }}
                onClick={() => this.setState({ mode: this.PAGE_MODE_DETACH_BUCKET_PANEL })}
                title="DETACH BUCKET"
              />
            )}
          </div>
        </>
      );
    }

    renderDetachBucketPanel = (buckets, bucket_ident) => {
      const bucket = buckets.filter(b => b.getBucketIdentifier() === bucket_ident)[0];

      const albums = this.props.albums.filter(a => a.getBucketIdentifier() === bucket_ident);

      if (albums.length > 0) {
        return (
          <>
            <div className="main-form">
              <div className="form-title" style={{ marginBottom: '4rem' }}>Detach Bucket</div>

              <c.StaticText>
                Bucket <b>{bucket.getBucketName()}</b> cannot be detached, because it is
                used by the following albums:
              </c.StaticText>

              <div style={{ marginTop: '3rem' }}>
                { albums.map(a => <AlbumListItem album={a} />) }
              </div>

              <c.WhiteButton
                onClick={() => this.setState({ mode: this.PAGE_MODE_BUCKET })}
                title="CANCEL"
              />
            </div>
          </>
        );
      } else {
        return (
          <>
            <div className="main-form">
              <div className="form-title" style={{ marginBottom: '4rem' }}>Detach Bucket</div>

              <c.StaticText>
                Detach bucket <b>{bucket.getBucketName()}</b> ?
              </c.StaticText>

              <c.DangerButton
                onClick={() => {
                  this.setState({ mode: this.PAGE_MODE_DETACH_BUCKET_IN_PROGRESS });
                  setTimeout(() => this.handleDetachBucketClick(bucket), 100);
                }}
                disabled={this.state.mode === this.PAGE_MODE_DETACH_BUCKET_IN_PROGRESS}
                title={this.state.mode === this.PAGE_MODE_DETACH_BUCKET_IN_PROGRESS ? 'PLEASE WAIT...' : 'DETACH BUCKET'}
              />

              <c.WhiteButton
                style={{ marginTop: '1rem' }}
                onClick={() => this.setState({ mode: this.PAGE_MODE_BUCKET })}
                title="CANCEL"
              />
            </div>
          </>
        );
      }
    }

    // eslint-disable-next-line arrow-body-style
    renderBucketListPanel = (buckets) => {
      return (
        <>
          <div className="main-form">
            <div className="form-title" style={{ marginBottom: '4rem' }}>Your Storage</div>

            {buckets.map(b => <BucketListItem key={b.getBucketIdentifier()} bucket={b} />)}

            <c.WhiteButton
              onClick={() => this.setState({ mode: this.PAGE_MODE_NEW_BUCKET })}
              title="ATTACH STORAGE"
            />
          </div>
        </>
      );
    }

    renderDialog = (mode) => {
      let title;

      // eslint-disable-next-line default-case
      switch (mode) {
        case this.PAGE_MODE_NEW_BUCKET_SUCCESS:
          title = 'Successfully Attached Storage';
          break;
        case this.PAGE_MODE_NEW_BUCKET_ERROR:
          title = 'Error attaching storage';
          break;
        case this.PAGE_MODE_DETACH_BUCKET_SUCCESS:
          title = 'Storage Detached';
          break;
        case this.PAGE_MODE_DETACH_BUCKET_ERROR:
          title = 'Error Detaching Storage';
          break;
      }

      return (
        <>
          <div className="main-form">
            <div className="form-title">{title}</div>
            <c.WhiteButton
              onClick={() => this.setState({ mode: this.PAGE_MODE_LIST })}
              title="OK"
            />
          </div>
        </>
      );
    }

    // eslint-disable-next-line consistent-return
    renderPanel = (buckets, bucket_ident) => {
      const { mode } = this.state;

      // eslint-disable-next-line default-case
      switch (mode) {
        case this.PAGE_MODE_LIST:
          return this.renderBucketListPanel(buckets);
        case this.PAGE_MODE_NEW_BUCKET:
        case this.PAGE_MODE_NEW_BUCKET_IN_PROGRESS:
          return this.renderNewBucketPanel();
        case this.PAGE_MODE_NEW_BUCKET_SUCCESS:
        case this.PAGE_MODE_NEW_BUCKET_ERROR:
        case this.PAGE_MODE_DETACH_BUCKET_SUCCESS:
        case this.PAGE_MODE_DETACH_BUCKET_ERROR:
          return this.renderDialog(mode);
        case this.PAGE_MODE_BUCKET:
          return this.renderBucketPanel(buckets, bucket_ident);
        case this.PAGE_MODE_DETACH_BUCKET_PANEL:
          return this.renderDetachBucketPanel(buckets, bucket_ident);
      }
    }

    render() {
      const {
        user,
        app,
        buckets,
        albums,
        match
      } = this.props;

      const { bucket_ident } = match.params;

      // const { bucket } = this.state;

      if (!user.getAuth()) {
        return <></>;
      }

      const show_side_menu = app.getShowSideMenu();
      // const main_panel_class =
      //     show_side_menu ? 'main-panel-with-menu' : 'main-panel-centered';

      return (
        <>
          { this.renderAlert() }
          <div className="main">
            <m.TopBar user={user} app={app} />
            {show_side_menu && (
              <m.SideMenu
                user={user}
                app={app}
                albums={albums}
                active="storage"
                onClose={() => app.setShowSideMenu(false)}
              />
            )}
            <div className="main-panel-centered">
              <div className="main-signup-panel">
                { this.renderPanel(buckets, bucket_ident) }
              </div>
            </div>
          </div>
        </>
      );
    }
}

export const StoragePage = withRouter(StoragePageComponent);
