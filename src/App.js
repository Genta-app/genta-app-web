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

/* eslint-disable no-restricted-syntax */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Route,
  Switch,
  Redirect,
  useHistory
} from 'react-router-dom';

import { AnalyticsProvider } from 'use-analytics';

import { ganalytics } from './library/GentaAnalytics';

import {
  packValue,
  unpackValue
} from './library/Pack';

import {
  apiLogin,
  apiGetRecall,
  apiPostRecall,
  apiLogout,
  apiLoadGuestList,
  apiShareAlbum,
  apiDeleteSharedAlbum,
  apiRespondAlbumShare,
  loadBucketList,
  deleteAlbum,
  createAlbum,
  updateAlbum,
  loadAlbumList,
  apiAlbumDownloadToken,
  apiFileIndex,
} from './library/Api';

import { MOST_RECENTLY_UPDATED_ALBUM } from './library/Album';

import * as crypto from './library/Crypto';

import { WaitForValidUser } from './components/WaitForValidUser';
import { User } from './library/User';
import { SignupPage } from './pages/Signup';
import {
  LoginPage,
  LogoutPage
} from './pages/Login';
import LandingPage from './pages/Landing';
import { StoragePage } from './pages/storage/Storage';
import { AlbumPage } from './pages/Album';
import { ViewAlbumPage } from './pages/viewalbum/ViewAlbum';
import { UploadPage } from './pages/Upload';
import { AccountPage } from './pages/Account';
import { SubscriptionPage } from './pages/Subscription';
import { DocPage } from './pages/doc/Doc';
import { ApplyForInvitePage } from './pages/ApplyForInvite';
import { EditPage } from './pages/Edit';

function ScrollToTop() {
  const history = useHistory();

  useEffect(() => {
    const unlisten = history.listen(() => {
      window.scrollTo(0, 0);
    });
    return () => {
      unlisten();
    };
  }, []);

  return (null);
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.download_auth_cache = {};
    this.upload_token_cache = {};

    this.state = {
      user: null,
      user_recall_complete: false,
      buckets: [],
      albums: null,
      show_side_menu: false,
      show_feedback_dialog: false,
    };
  }

  setShowSideMenu(show_side_menu) {
    this.setState({ show_side_menu });
  }

  getShowSideMenu() {
    const { show_side_menu } = this.state;
    return show_side_menu;
  }

  setShowFeedbackDialog(show_feedback_dialog) {
    this.setState({ show_feedback_dialog });
  }

  getShowFeedbackDialog() {
    const { show_feedback_dialog } = this.state;
    return show_feedback_dialog;
  }

  isUserRecallComplete = () => {
    const { user_recall_complete } = this.state;
    return user_recall_complete;
  }

  getAlbumDownloadAuth = async (album_identifier) => {
    const ts = (+new Date()) / 1000;

    const cached = (album_identifier in this.download_auth_cache)
      && (this.download_auth_cache[album_identifier].expires > (ts + 10 * 60));

    if (!cached) {
      const xhr = await apiAlbumDownloadToken(packValue({
        album: {
          identifier: album_identifier,
        }
      }));
      const resppack = unpackValue(xhr.response);
      this.download_auth_cache[album_identifier] = resppack.album;
    }

    return this.download_auth_cache[album_identifier];
  }

  remoteLoginUser = async (email, auth_hash) => {
    const xhr = await apiLogin(packValue({
      user: {
        email,
        auth: auth_hash,
      },
    }));
    return xhr;
  }

  loginUser = async (email, password) => {
    // proceed to normal login
    const email_array = new Uint8Array(Buffer.from(email));
    const auth_hash = crypto.deriveAuthKey(email_array, password);
    const remote_login_promise = this.remoteLoginUser(email, auth_hash);

    const user = new User();
    const master_key = crypto.deriveMasterKey(email_array, password);
    const xhr = await remote_login_promise;

    if (xhr.status === 200) {
      const unpack = unpackValue(new Uint8Array(xhr.response));
      const {
        public_key,
        account_type,
        encrypted_private_key,
        default_album_ident,
        default_bucket_ident,
        subscription_status,
        subscription_end,
        email_confirmed,
        max_storage_gb,
      } = unpack.user;

      const private_key = crypto.symmetricDecrypt(master_key, encrypted_private_key);

      user.setEmail(email);
      user.setEmailVerified(email_confirmed);
      user.setAccountType(account_type);
      user.setKeys(master_key, private_key, public_key, auth_hash);
      user.setDefaultAlbumIdent(default_album_ident);
      user.setDefaultBucketIdent(default_bucket_ident);
      user.setAuth(true);

      user.setSubscriptionEnd(subscription_end);
      user.setSubscriptionStatus(subscription_status);
      user.setMaxStorageGB(max_storage_gb);

      const load_albums_promise = this.loadAlbumList(user);
      const load_buckets_promise = this.loadBucketList(user);
      const load_guest_list_promise = this.loadGuestList(user);

      apiPostRecall().then((resp) => {
        if (resp.status !== 200) {
          return;
        }

        const { recall_digest } = unpackValue(resp.response);

        const local_store_pack = packValue({
          email,
          master_key,
          private_key,
          public_key,
          auth_hash,
        });

        const encrypted_local_store_pack = crypto.symmetricEncrypt(
          recall_digest,
          local_store_pack
        );

        const storage_item_str = encrypted_local_store_pack.map(x => `${x}`).join(',');

        localStorage.setItem('digest', storage_item_str);
      });

      await Promise.all([
        load_albums_promise,
        load_buckets_promise,
        load_guest_list_promise,
      ]);
    }

    this.setState({ user });
    return xhr.status === 200;
  }

  logoutUser = async (remote_logout) => {
    localStorage.removeItem('digest');
    if (remote_logout) {
      await apiLogout();
    }
    this.resetUserToAnonymous();
  }

    resetUserToAnonymous = () => {
      this.setState({ user: new User() });
    }

  loadGuestList = async (auser) => {
    const { user } = this.state;

    try {
      const guest_list = await apiLoadGuestList();
      if (auser == null) {
        user.setGuestList(guest_list);
      }
      auser.setGuestList(guest_list);
    } catch (e) {
      console.error(e);
    }
  }

  shareAlbum = async (album, email_to, share_allow_add_files) => {
    const { user } = this.state;

    const success = await apiShareAlbum(
      user,
      album,
      email_to,
      share_allow_add_files
    );
    await this.loadAlbumList(user);
    return success;
  }

  deleteSharedAlbum = async (album, email_to) => {
    const { user } = this.state;
    const success = await apiDeleteSharedAlbum(album, email_to);
    await this.loadAlbumList(user);
    return success;
  }

  respondAlbumShare = async (album, response) => {
    const { user } = this.state;
    const success = await apiRespondAlbumShare(album, response);
    await this.loadAlbumList(user);
    return success;
  }

  componentDidMount = async () => {
    await crypto.so.ready; // make sure crypto is usable

    try {
      const storage_item_str = localStorage.getItem('digest');
      if (storage_item_str == null) {
        throw new Error('skip recall');
      }

      // recall
      const recall_xhr = await apiGetRecall();
      const {
        recall_digest,
        account_type,
        default_album_ident,
        default_bucket_ident,
        email_confirmed,
        subscription_status,
        subscription_end,
        max_storage_gb,
      } = unpackValue(recall_xhr.response);

      const encrypted_local_store_pack = new Uint8Array(
        storage_item_str.split(',').map(x => parseInt(x, 10))
      );

      const decrypted_local_store_pack = crypto.symmetricDecrypt(
        recall_digest,
        encrypted_local_store_pack
      );

      const {
        email,
        master_key,
        private_key,
        public_key,
        auth_hash,
      } = unpackValue(decrypted_local_store_pack);

      const user = new User();
      user.setEmail(email);
      user.setEmailVerified(email_confirmed);
      user.setAccountType(account_type);
      user.setKeys(master_key, private_key, public_key, auth_hash);
      user.setDefaultAlbumIdent(default_album_ident);
      user.setDefaultBucketIdent(default_bucket_ident);
      user.setSubscriptionStatus(subscription_status);
      user.setSubscriptionEnd(subscription_end);
      user.setAuth(true);
      user.setMaxStorageGB(max_storage_gb);

      const load_albums_promise = this.loadAlbumList(user);
      const load_buckets_promise = this.loadBucketList(user);
      const load_guest_list_promise = this.loadGuestList(user);

      await Promise.all([
        load_albums_promise,
        load_buckets_promise,
        load_guest_list_promise,
      ]);

      this.setState({
        user,
        user_recall_complete: true,
      });
    } catch (e) {
      this.setState({
        user_recall_complete: true,
        user: new User(),
      });
      console.error(e);
    }
  }

  getUser = () => {
    const { user } = this.state;
    return user;
  };

  getBucketList = () => {
    const { buckets } = this.state;
    return buckets;
  }

  getAlbum = (ident) => {
    const { albums } = this.state;

    if (ident === MOST_RECENTLY_UPDATED_ALBUM) {
      const sorted_by_update = albums.slice().sort((a, b) => {
        const m1 = a.getMaxDate();
        const m2 = b.getMaxDate();
        if (m1 < m2) {
          return -1;
        }
        if (m1 > m2) {
          return 1;
        }
        return 0;
      });
      const l = sorted_by_update.length;
      if (l > 0) {
        return sorted_by_update[l - 1];
      }
      return null;
    }

    for (const a of albums) {
      if (a.getAlbumIdentifier() === ident) {
        return a;
      }
    }
    return null;
  }

  albumWithNameExists = (album_name) => {
    const { albums } = this.state;
    return albums.filter(a => a.getAlbumName() === album_name).length > 0;
  }

  getBucket = (ident) => {
    const { buckets } = this.state;
    for (const a of buckets) {
      if (a.getBucketIdentifier() === ident) {
        return a;
      }
    }
    return null;
  }

  loadAlbumList = async (user) => {
    try {
      const album_list = await loadAlbumList(user);
      // in case of a network error, do not reload albums with empty list
      const { albums } = this.state;
      if (album_list == null && albums.length > 0) {
        return albums;
      }
      this.setState({ albums: album_list });
      return album_list;
    } catch (e) {
      console.log(e);
      this.setState({ albums: [] });
      return [];
    }
  }

  loadBucketList = async (user) => {
    try {
      const bucket_list = await loadBucketList(user);
      this.setState({ buckets: bucket_list });
    } catch (e) {
      console.log(e);
      this.setState({ buckets: [] });
    }
  }

  createAlbum = (album_name, bucket_identifier, encrypt) => {
    const { user } = this.state;
    return /* await */ createAlbum(user, album_name, bucket_identifier, encrypt);
  }

  deleteAlbum = album_identifier => /* await */ deleteAlbum(album_identifier);


  updateAlbum = (album, album_name) => {
    const { user } = this.state;
    return /* await */ updateAlbum(user, album, album_name);
  }

  loadFileIndexInfo = async (album, stock_file) => {
    const file_index_xhr = await apiFileIndex(stock_file.getFileIdentifier());

    if (file_index_xhr.status !== 200) {
      return false;
    }

    if (album.getEncrypted()) {
      const file_key = stock_file.getFileKey();
      const encrypted_index_info_list = unpackValue(file_index_xhr.response).index_info;

      for (const info of encrypted_index_info_list) {
        const index_info_pack = crypto.symmetricDecrypt(file_key, info.data);
        const index_info = unpackValue(index_info_pack);
        index_info.bucket_size = info.bucket_size;
        stock_file.setIndexInfo(index_info.large_file_media_type, index_info);
      }
    } else {
      const index_info_list = unpackValue(file_index_xhr.response).index_info;
      for (const info of index_info_list) {
        const index_info = unpackValue(info.data);
        index_info.bucket_size = info.bucket_size;
        stock_file.setIndexInfo(index_info.large_file_media_type, index_info);
      }
    }

    return true;
  }

  uploadTokenCachePut(album, upload_token, upload_url, token_create_timestamp) {
    const ident = album.getAlbumIdentifier();
    if (this.upload_token_cache[ident] === undefined) {
      this.upload_token_cache[ident] = [];
    }
    this.upload_token_cache[ident].push([
      upload_token,
      upload_url,
      token_create_timestamp,
    ]);
  }

  uploadTokenCacheTake(album) {
    const ident = album.getAlbumIdentifier();
    if (this.upload_token_cache[ident] === undefined) {
      return [null, null, null];
    }

    // B2 upload tokens are valid for 24h or until an upload is rejected
    while (this.upload_token_cache[ident].length > 0) {
      const [token, url, timestamp] = this.upload_token_cache[ident].pop();
      if (timestamp > (Date.now() / 1000 - 12 * 3600)) {
        return [token, url, timestamp];
      }
    }
    return [null, null, null];
  }

  render() {
    const { user, buckets, albums } = this.state;

    return (
      <AnalyticsProvider instance={ganalytics}>
        <WaitForValidUser user={user} albums={albums}>
          <BrowserRouter>
            <ScrollToTop />
            <Switch>
              <Route exact path="/">
                <Redirect to="/index.html" />
              </Route>
              <Route
                path="/index.html"
                render={props => (
                  <LandingPage
                    {...props}
                    app={this}
                    user={user}
                  />
                )}
              />
              <Route exact path="/signup">
                <SignupPage app={this} user={user} />
              </Route>
              <Route exact path="/apply">
                <ApplyForInvitePage app={this} user={user} />
              </Route>
              <Route
                exact
                path="/signup/:email/:email_code"
                component={props => (
                  <SignupPage
                    app={this}
                    {...props}
                    user={user}
                  />
                )}
              />
              <Route path="/login">
                <LoginPage app={this} user={user} />
              </Route>
              <Route path="/logout">
                <LogoutPage app={this} user={user} />
              </Route>
              <Route
                path="/storage"
                render={props => (
                  <StoragePage
                    {...props}
                    app={this}
                    albums={albums}
                    buckets={buckets}
                    user={user}
                  />
                )}
              />
              <Route
                path="/edit/:item_ident"
                render={props => (
                  <EditPage
                    {...props}
                    app={this}
                    albums={albums}
                    buckets={buckets}
                    user={user}
                  />
                )}
              />
              <Route
                exact
                path="/album/:album_ident"
                render={props => (
                  <AlbumPage
                    {...props}
                    app={this}
                    albums={albums}
                    buckets={buckets}
                    user={user}
                  />
                )}
              />
              <Route
                exact
                path={['/zoom/:album_ident']}
                render={props => (
                  <ViewAlbumPage
                    {...props}
                    app={this}
                    albums={albums}
                    user={user}
                  />
                )}
              />
              <Route
                exact
                path={[
                  '/view',
                  '/view/:album_ident/',
                  '/view/:album_ident/:yyyymmdd',
                ]}
                render={props => (
                  <ViewAlbumPage
                    {...props}
                    app={this}
                    albums={albums}
                    user={user}
                  />
                )}
              />
              <Route exact path="/upload">
                <UploadPage
                  app={this}
                  buckets={buckets}
                  albums={albums}
                  user={user}
                />
              </Route>
              <Route
                exact
                path="/upload/:album_ident"
                render={props => (
                  <UploadPage
                    {...props}
                    app={this}
                    buckets={buckets}
                    albums={albums}
                    user={user}
                  />
                )}
              />
              <Route
                path="/account"
                render={props => (
                  <AccountPage
                    {...props}
                    app={this}
                    albums={albums}
                    buckets={buckets}
                    user={user}
                  />
                )}
              />
              <Route
                exact
                path={[
                  '/sub',
                  '/sub/:option',
                ]}
                render={props => (
                  <SubscriptionPage
                    {...props}
                    app={this}
                    albums={albums}
                    buckets={buckets}
                    user={user}
                  />
                )}
              />
              <Route
                path="/doc"
                render={props => (
                  <DocPage
                    {...props}
                    app={this}
                    albums={albums}
                    buckets={buckets}
                    user={user}
                  />
                )}
              />
            </Switch>
          </BrowserRouter>
        </WaitForValidUser>
      </AnalyticsProvider>
    );
  }
}

export default App;

ReactDOM.render(
  <App />,
  document.getElementById('root'),
);
