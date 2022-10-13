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

/* eslint-disable lines-between-class-members */
/* eslint-disable react/jsx-one-expression-per-line */

import React from 'react';

import {
  useRouteMatch,
  Switch,
  Route,
  Link,
  Redirect,
  useHistory
} from 'react-router-dom';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';
import * as m from '../components/Menu';

import { MOST_RECENTLY_UPDATED_ALBUM } from '../library/Album';
import { ACCOUNT_TYPE_STANDARD, ACCOUNT_TYPE_FREE } from '../library/User';

import { Page } from './Page';
import { packValue, unpackValue } from '../library/Pack';

import {
  apiUpgradeAccount,
  apiDeleteUser,
  apiUpdateUser,
  apiUserChangePassword,
} from '../library/Api';

import * as crypto from '../library/Crypto';

import { SignupChooseAccountType } from './Signup';

// panel mode values
// const USER_DETAILS = 0;
// const DELETE_USER_DIALOG_NORMAL = 1;
// const DELETE_USER_DIALOG_NOT_EMPTY = 2;
// const CHANGE_PASSWORD = 3;

export class MostRecentlyUpdatedAlbum {
    getAlbumName = () => 'Most Recently Updated';

    getAlbumIdentifier = () => MOST_RECENTLY_UPDATED_ALBUM;
}

class AccountSettingsForm extends Page {
    MODE_DEFAULT = 1;
    MODE_CHANGE_PASSWORD_FORM = 2;
    MODE_DELETE_ACCOUNT_FORM = 3;
    MODE_DELETE_ACCOUNT_CONFIRMATION = 4;

    constructor(props) {
      super(props);
      this.state = {
        albumlist_open: false,
        mode: this.MODE_DEFAULT,
        change_password_current: '',
        change_password_current_clear: false,
        change_password_current_red_text: '',
        change_password_new: '',
        change_password_new_clear: false,
        change_password_repeat: '',
        change_password_repeat_red_text: '',
        change_password_working: false,
        delete_account_text: '',
        delete_account_red_text: '',
        delete_account_password: '',
        delete_account_password_clear: false,
        delete_account_password_red_text: '',
        delete_account_working: false,
      };
    }

    initSelectedAlbum() {
      const { user } = this.props;
      const album_ident = user.getDefaultAlbumIdent();
      this.setState({ selected_album_ident: album_ident });
    }

    componentDidMount() {
      this.initSelectedAlbum();
    }

    componentDidUpdate = (prevProps) => {
      const { user } = this.props;

      if (prevProps.user !== user) {
        this.initSelectedAlbum();
      }
    }

    handleChangePassword = async () => {
      const { user } = this.props;

      const {
        change_password_current,
        change_password_new,
        change_password_repeat,
      } = this.state;

      if (change_password_new !== change_password_repeat) {
        this.setState({
          change_password_working: false,
          change_password_repeat_red_text: 'passwords do not match',
        });
        return;
      }

      const email_array = new Uint8Array(Buffer.from(user.getEmail()));
      const old_password = change_password_current;
      const password = change_password_new;
      const private_key = user.getPrivateKey();

      const old_auth_hash = crypto.deriveAuthKey(email_array, old_password);
      const auth_hash = crypto.deriveAuthKey(email_array, password);

      // master key is never stored, always derived from password on client
      const master_key = crypto.deriveMasterKey(email_array, password);
      const encrypted_private_key = crypto.symmetricEncrypt(master_key, private_key);

      const pack = packValue({
        user: {
          old_auth: old_auth_hash,
          auth: auth_hash,
          encrypted_private_key,
        },
      });

      const xhr = await apiUserChangePassword(pack);

      if (xhr.status === 200) {
        this.setAlertMessage('Password updated');
        this.setState({ mode: this.MODE_DEFAULT, change_password_working: false });
      } else if (xhr.status === 401) {
        this.setState({ change_password_current_red_text: 'Invalid current password' });
      } else {
        this.setAlertError('Password update failed. Please try later');
        this.setState({ mode: this.MODE_DEFAULT, change_password_working: false });
      }
    }

    handleDeleteAccount = async () => {
      const { user, app } = this.props;

      const {
        delete_account_text,
        delete_account_password,
      } = this.state;

      if (delete_account_text.toUpperCase() !== 'DELETE ACCOUNT') {
        this.setState({
          delete_account_working: false,
          delete_account_red_text: "type 'delete account'",
        });
        return;
      }

      const email = user.getEmail();
      const email_array = new Uint8Array(Buffer.from(email));
      const password = delete_account_password;
      const auth_hash = crypto.deriveAuthKey(email_array, password);

      const login_xhr = await app.remoteLoginUser(email, auth_hash);
      if (login_xhr.status !== 200) {
        this.setState({
          delete_account_working: false,
          delete_account_password_red_text: 'Authentication failed',
          delete_account_text: '',
        });
        return;
      }

      const xhr = await apiDeleteUser();
      if (xhr.status === 200) {
        await app.logoutUser(false); // just to avoid FE confusion, not needed for BE
        this.setState({
          mode: this.MODE_DELETE_ACCOUNT_CONFIRMATION,
          delete_account_working: false,
          delete_account_text: '',
        });
      } else {
        this.setAlertError('Account deletion failed. Please try later');
        this.setState({
          mode: this.MODE_DEFAULT,
          delete_account_working: false,
          delete_account_text: '',
        });
      }
    }

    handleSaveDefaultAlbum = async (album_ident) => {
      const { user } = this.props;

      const def_bucket_ident = user.getDefaultBucketIdent();
      const pack = packValue({
        user: {
          default_album_ident: album_ident,
          default_bucket_ident: def_bucket_ident,
        },
      });
      const xhr = await apiUpdateUser(pack);
      if (xhr.status === 200) {
        this.setAlertMessage('Saved default album');
      } else {
        this.setAlertError('Saving default album failed. Please try again later');
      }
    }

    onAlbumlistClick = (el_type, value) => {
      const { selected_album_ident, albumlist_open } = this.state;

      if (el_type === 'dropdown') {
        this.setState({ albumlist_open: !albumlist_open });
      } else if (el_type === 'item') {
        const new_def_album_ident = value.album.getAlbumIdentifier();
        this.setState({
          albumlist_open: !albumlist_open,
          selected_album_ident: new_def_album_ident,
        });

        if (selected_album_ident !== new_def_album_ident) {
          /* await */ this.handleSaveDefaultAlbum(new_def_album_ident);
        }
      }
    }

    getAlbumList = () => [new MostRecentlyUpdatedAlbum()].concat(this.props.albums);

    getSelectedAlbum = () => {
      const { selected_album_ident } = this.state;
      const found_album = this.getAlbumList().find(
        a => a.getAlbumIdentifier() === selected_album_ident
      );
      return found_album || null;
    }

    onManageSubscriptionClick = () => {
      const { history } = this.props;
      history.push('/sub');
    }

    renderAccountForm() {
      const {
        user,
        app,
        albums,
        history
      } = this.props;

      const account_type = user.getAccountType();
      const selected_album = this.getSelectedAlbum();
      const selected_album_name = selected_album ? selected_album.getAlbumName() : '';

      const {
        albumlist_open,
      } = this.state;

      const albumlist = this.getAlbumList().map(a => ({
        label: a.getAlbumName(),
        album: a,
      }));

      // const {is_nosub, is_viewer, is_trial, is_expired_trial, is_active_trial,
      //     is_paid, is_suberror} = user.getSubscriptionStatusMap();

      // let subscription_str;

      // if (is_viewer) {
      //     subscription_str = "VIEWER";
      // } else if (is_active_trial) {
      //     subscription_str = `TRIAL, active to ${formatDate(user.getSubscriptionEnd())}`;
      // } else if (is_expired_trial) {
      //     subscription_str = "TRIAL, EXPIRED";
      // } else if (is_paid) {
      //     subscription_str =
      //         `STANDARD, ${formatSize(user.getMaxStorageGB()*1000*1000*1000)} Storage`;
      // }

      const subscription_str = user.getAccountType().toUpperCase();

      const show_side_menu = app.getShowSideMenu();

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
                onClose={() => app.setShowSideMenu(false)}
                active="account"
              />
            )}

            <div className="main-panel-centered">
              <div className="main-signup-panel">
                <div className="main-form">
                  <div className="form-title">Your Account</div>
                  <c.TextWithLabel label="EMAIL" value={user.getEmail()} />
                  <c.TextWithLabel label="ACCOUNT TYPE" value={subscription_str} />
                  <c.DropdownList
                    onClick={this.onAlbumlistClick}
                    open={albumlist_open}
                    items={albumlist}
                    label="DEFAULT ALBUM"
                    value={selected_album_name}
                  />

                  {account_type === ACCOUNT_TYPE_FREE && (
                    <c.SuperWhiteButton
                      title="UPGRADE ACCOUNT"
                      onClick={() => history.push('/account/upgrade')}
                    />
                  )}

                  <c.WhiteButton
                    title="CHANGE PASSWORD"
                    onClick={() => this.setState({ mode: this.MODE_CHANGE_PASSWORD_FORM })}
                  />
                  <c.DangerButton
                    style={{ marginTop: '1rem' }}
                    onClick={() => this.setState({ mode: this.MODE_DELETE_ACCOUNT_FORM })}
                    title="DELETE ACCOUNT"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    renderChangePasswordForm() {
      const { user, app, albums } = this.props;

      const {
        change_password_current,
        change_password_current_clear,
        change_password_current_red_text,
        change_password_new,
        change_password_new_clear,
        change_password_repeat,
        change_password_repeat_red_text,
        change_password_working,
      } = this.state;

      const show_side_menu = app.getShowSideMenu();

      const change_password_current_icon = (change_password_current_clear
        ? (
          <icon.IconEyeSlash onClick={
            () => this.setState({ change_password_current_clear: !change_password_current_clear })
          }
          />
        )
        : (
          <icon.IconEye onClick={
            () => this.setState({ change_password_current_clear: !change_password_current_clear })
          }
          />
        )
      );

      const change_password_new_icon = (change_password_new_clear
        ? (
          <icon.IconEyeSlash onClick={
            () => this.setState({ change_password_new_clear: !change_password_new_clear })}
          />
        )
        : (
          <icon.IconEye onClick={
            () => this.setState({ change_password_new_clear: !change_password_new_clear })}
          />
        )
      );

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
                onClose={() => app.setShowSideMenu(false)}
                active="account"
              />
            )}

            <div className="main-panel-centered">
              <div className="main-signup-panel">
                <div className="main-form">
                  <div className="form-title">Change Password</div>
                  <c.PasswordInput
                    value={change_password_current}
                    clear={change_password_current_clear}
                    back_icon={change_password_current_icon}
                    onChange={(ev) => {
                      this.setState({ change_password_current: ev.target.value });
                    }}
                    red_text={change_password_current_red_text}
                    icon={icon.icon_lock}
                    placeholder="CURRENT PASSWORD"
                  />
                  <c.PasswordInput
                    value={change_password_new}
                    clear={change_password_new_clear}
                    back_icon={change_password_new_icon}
                    onChange={(ev) => {
                      this.setState({ change_password_new: ev.target.value });
                    }}
                    icon={icon.icon_lock}
                    placeholder="NEW PASSWORD"
                  />
                  <c.PasswordInput
                    value={change_password_repeat}
                    clear={change_password_new_clear}
                    back_icon={change_password_new_icon}
                    onChange={(ev) => {
                      this.setState({ change_password_repeat: ev.target.value });
                    }}
                    red_text={change_password_repeat_red_text}
                    icon={icon.icon_lock}
                    placeholder="NEW PASSWORD"
                  />
                  <c.SuperWhiteButton
                    title={change_password_working ? 'CHANGE PASSWORD' : 'PLEASE WAIT...'}
                    onClick={() => {
                      this.setState({ change_password_working: true });
                      setTimeout(this.handleChangePassword, 100);
                    }}
                  />
                  <c.WhiteButton
                    disabled={change_password_working}
                    onClick={() => this.setState({ mode: this.MODE_DEFAULT })}
                    style={{ marginTop: '1rem' }}
                    title="CANCEL"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    renderDeleteAccountForm() {
      const { user, app } = this.props;

      const {
        delete_account_text,
        delete_account_red_text,
        delete_account_password,
        delete_account_password_clear,
        delete_account_password_red_text,
        delete_account_working,
      } = this.state;

      const show_side_menu = app.getShowSideMenu();

      const delete_account_password_icon = (delete_account_password_clear
        ? (
          <icon.IconEyeSlash onClick={
            () => this.setState({ delete_account_password_clear: !delete_account_password_clear })}
          />
        )
        : (
          <icon.IconEye onClick={
            () => this.setState({ delete_account_password_clear: !delete_account_password_clear })}
          />
        )
      );

      return (
        <>
          { this.renderAlert() }
          <div className="main">
            <m.TopBar user={user} app={app} />
            {show_side_menu && (
              <m.SideMenu
                user={user}
                app={app}
                // TODO: this is a bug
                // eslint-disable-next-line no-undef
                albums={albums}
                onClose={() => app.setShowSideMenu(false)}
                active="account"
              />
            )}

            <div className="main-panel-centered">
              <div className="main-signup-panel">
                <div className="main-form">
                  <div className="form-title">Delete Account</div>

                  <c.StaticText>
                    Sad to see you go.
                    <br />
                    Your account will be deactivated immediately and fully
                    deleted after a 72h waiting period.
                  </c.StaticText>

                  <c.PasswordInput
                    value={delete_account_password}
                    clear={delete_account_password_clear}
                    back_icon={delete_account_password_icon}
                    onChange={(ev) => {
                      this.setState({ delete_account_password: ev.target.value });
                    }}
                    red_text={delete_account_password_red_text}
                    icon={icon.icon_lock}
                    placeholder="ENTER CURRENT PASSWORD"
                  />
                  <c.TextInput
                    placeholder="TYPE 'DELETE ACCOUNT'"
                    onChange={ev => this.setState({ delete_account_text: ev.target.value })}
                    red_text={delete_account_red_text}
                    value={delete_account_text}
                  />
                  <c.DangerButton
                    title={delete_account_working ? 'PLEASE WAIT...' : 'DELETE ACCOUNT'}
                    onClick={() => {
                      this.setState({ delete_account_working: true });
                      setTimeout(this.handleDeleteAccount, 100);
                    }}
                  />
                  <c.WhiteButton
                    disabled={delete_account_working}
                    onClick={
                      () => this.setState({ mode: this.MODE_DEFAULT, delete_account_text: '' })
                    }
                    style={{ marginTop: '1rem' }}
                    title="CANCEL"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    renderDeleteAccountConfirmation = () => (
      <>
        <div style={{ margin: '5rem auto', textAlign: 'center' }}>
          <h4>
            You account was deactivated and will be automatically
            deleted after a 72h waiting period.
            <br />
            <br />
            <Link to="/index.html">Go to Main Page</Link>
          </h4>
        </div>
      </>
    );

    render() {
      const { mode } = this.state;

      switch (mode) {
        case this.MODE_DEFAULT:
          return this.renderAccountForm();
        case this.MODE_CHANGE_PASSWORD_FORM:
          return this.renderChangePasswordForm();
        case this.MODE_DELETE_ACCOUNT_FORM:
          return this.renderDeleteAccountForm();
        case this.MODE_DELETE_ACCOUNT_CONFIRMATION:
          return this.renderDeleteAccountConfirmation();
        default:
          console.error('invalid mode: ', mode);
          return <></>;
      }
    }
}

const handleUpgradeAccount = async (user, onSuccess, onFailure) => {
  const xhr = await apiUpgradeAccount();

  if (xhr.status === 200) {
    const unpack = unpackValue(xhr.response);
    user.setAccountType(unpack.accountType);
    user.setMaxStorageGB(unpack.max_storage_gb);
    onSuccess();
  } else {
    onFailure();
  }
};

const AccountUpgradeForm = ({
  user,
  app,
  albums,
  history
}) => {
  if (user.getAccountType() === ACCOUNT_TYPE_STANDARD) {
    return <Redirect to="/account" />;
  }

  const show_side_menu = app.getShowSideMenu();

  return (
    <>
      <div className="main">
        <m.TopBar user={user} app={app} />
        {show_side_menu && (
          <m.SideMenu
            user={user}
            app={app}
            albums={albums}
            onClose={() => app.setShowSideMenu(false)}
            active="account"
          />
        )}
        <SignupChooseAccountType
          upgrade
          account_type={ACCOUNT_TYPE_STANDARD}
          onContinue={() => handleUpgradeAccount(
            user,
            () => history.push('/account/upgrade/success'),
            () => history.push('/account/upgrade/failure')
          )}
        />
      </div>
    </>
  );
};

const AccountUpgradeConfirmation = ({ user, app, albums }) => {
  const history = useHistory();
  const show_side_menu = app.getShowSideMenu();

  return (
    <>
      <div className="main">
        <m.TopBar user={user} app={app} />
        {show_side_menu && (
          <m.SideMenu
            user={user}
            app={app}
            albums={albums}
            onClose={() => app.setShowSideMenu(false)}
            active="account"
          />
        )}

        <div className="main-panel-centered">
          <div className="main-signup-panel">
            <div className="main-form">
              <div className="form-title">Congratulations!</div>

              <div className="doc-para">
                Your account was upgraded to <span className="doc-inline-caps">STANDARD</span> with
                first 3 months free
              </div>

              <c.WhiteButton
                style={{ margin: '0 auto' }}
                onClick={() => history.push('/doc/attach-backblaze-storage')}
                title="OK"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// eslint-disable-next-line no-unused-vars
const AccountUpgradeFailure = ({ success, failure }) => {
};

export const AccountPage = (props) => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={`${path}`}>
        <AccountSettingsForm {...props} />
      </Route>
      <Route exact path={`${path}/upgrade`}>
        <AccountUpgradeForm {...props} />
      </Route>
      <Route exact path={`${path}/upgrade/success`}>
        <AccountUpgradeConfirmation {...props} />
      </Route>
      <Route exact path={`${path}/upgrade/failure`}>
        <AccountUpgradeFailure {...props} />
      </Route>
    </Switch>
  );
};
