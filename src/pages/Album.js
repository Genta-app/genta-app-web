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

import { withRouter } from 'react-router';

import { getBucketNameFromIdentifier } from '../library/Bucket';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';
import * as m from '../components/Menu';

import { Page } from './Page';

import {
  validateEmail,
  parseYMD,
  formatSize,
  formatHumanFriendlyDate,
} from '../library/Format';

import * as api from '../library/Api';

import {
  packValue,
  unpackValue,
} from '../library/Pack';

class AlbumPageComponent extends Page {
    PAGE_MODE_DEFAULT = 1;
    PAGE_MODE_DELETE_NOT_EMPTY = 2;
    PAGE_MODE_DELETED_CONFIRM = 3;
    PAGE_MODE_SHARE = 4;
    PAGE_MODE_INVITE = 5;
    PAGE_MODE_NEW_ALBUM = 6;

    constructor(props) {
      super(props);
      this.state = {
        mode: this.PAGE_MODE_DEFAULT,
        album_ident: null,
        album_edit_name: '',
        share_email_address: '',
        share_allow_add_files: false,
        share_list_open: false,
        spinner: false,
        selected_bucket: null,
      };
    }

    initSelectedAlbum() {
      const {
        albums,
        user,
        match,
        buckets
      } = this.props;
      let { album_ident } = match.params;

      if (album_ident === 'new') {
        const default_bucket = user.getDefaultBucketIdent();
        const selected_bucket = buckets.filter(
          b => b.getBucketIdentifier() === default_bucket
        )[0];
        this.setState(
          { mode: this.PAGE_MODE_NEW_ALBUM, selected_bucket, album_edit_name: '' }
        );
        return;
      }

      if (!album_ident) {
        album_ident = user.getDefaultAlbumIdent();
      }

      const filtered_list = albums.filter(a => a.getAlbumIdentifier() === album_ident);

      if (filtered_list.length > 0) {
        const album = filtered_list[0];
        this.setState({
          album,
          album_edit_name: album.getAlbumName(),
          mode: this.PAGE_MODE_DEFAULT,
        });
      }
    }

    handleUpdateAlbum = async () => {
      const { app } = this.props;
      const { album, album_edit_name } = this.state;

      const xhr = await app.updateAlbum(album, album_edit_name);
      if (xhr.status === 200) {
        album.setAlbumName(album_edit_name);
        this.forceUpdate();
        // this.setAlertMessage("Album updated");
      } else {
        this.setAlertError('Album update failed. Please try again later');
      }
    }

    handleShareClick = () => {
      this.setState({ mode: this.PAGE_MODE_SHARE });
    }

    handleDoShare = async () => {
      const { app } = this.props;
      const { album, share_email_address, share_allow_add_files } = this.state;
      const xhr_status = await app.shareAlbum(
        album,
        share_email_address,
        share_allow_add_files
      );
      this.initSelectedAlbum();

      if (xhr_status === 200) {
        this.setAlertMessage('Album shared');
        this.setState({ mode: this.PAGE_MODE_DEFAULT, share_email_address: '' });
      } else if (xhr_status === 409) {
        // no such user on the platform
        this.setState({ mode: this.PAGE_MODE_INVITE });
      } else {
        this.setAlertError('Error sharing album. Please try again later');
      }
    }

    handleDeleteClick = async () => {
      const { album } = this.state;
      const num_files = album.getFileCount();

      if (num_files > 0) {
        this.setState({ mode: this.PAGE_MODE_DELETE_NOT_EMPTY });
        return;
      }

      // const { albums } = this.state;
      const { app, user, /* history */ } = this.props;

      const def_album_ident = user.getDefaultAlbumIdent();
      const album_ident = album.getAlbumIdentifier();

      const xhr = await app.deleteAlbum(album_ident);
      if (xhr.status === 200) {
        const album_list = await app.loadAlbumList(user);

        if (def_album_ident === album_ident) {
          const new_def_album_ident = ((album_list.length === 0)
            ? ''
            : album_list[0].getDefaultAlbumIdent());
          const def_bucket_ident = user.getDefaultBucketIdent();
          const pack = packValue({
            user: {
              default_album_ident: new_def_album_ident,
              default_bucket_ident: def_bucket_ident,
            },
          });
          await api.apiUpdateUser(pack);
        }

        this.setState({ mode: this.PAGE_MODE_DELETED_CONFIRM });
      } else {
        this.setAlertError('Error deleting album. Please try again later');
      }
    }

    handleRejectForeignAlbum = async () => {
      const { app, history } = this.props;
      const { album } = this.state;

      const success = await app.respondAlbumShare(album, 'reject');
      if (success) {
        this.setAlertMessage('Album rejected');
        history.push('/view'); // redirect to the default album
      } else {
        this.setAlertError('Error. Please try later');
      }
    }

    handleShareListClick = (el_type, value) => {
      const { share_list_open } = this.state;

      if (el_type === 'dropdown') {
        this.setState({ share_list_open: !share_list_open });
      } else {
        console.log(el_type, value);
      }
    };

    handleStopShare = async (email_to) => {
      const { app } = this.props;
      const { album } = this.state;
      const success = await app.deleteSharedAlbum(album, email_to);
      this.initSelectedAlbum();

      if (success) {
        this.setAlertMessage('Album unshared');
      } else {
        this.setAlertError('Error unsharing album. Please try later');
      }
    }

    handleInviteUser = async () => {
      const { user } = this.props;
      const { share_email_address } = this.state;

      const success = await api.apiInvite(user, share_email_address);
      if (success) {
        this.setAlertMessage('Invite sent');
      } else {
        this.setAlertError('Error sending invite. Please try later');
      }
      this.setState({ mode: this.PAGE_MODE_DEFAULT, share_email_address: '' });
    }

    handleBucketListClick = (el_type, value) => {
      if (el_type === 'dropdown') {
        const { bucket_list_open } = this.state;
        this.setState({ bucket_list_open: !bucket_list_open });
      } else if (el_type === 'item') {
        this.setState({ selected_bucket: value.bucket, bucket_list_open: false });
      }
    }

    handleCreateAlbum = async () => {
      const { app, /* buckets, */ user, history } = this.props;
      const { album_edit_name, selected_bucket } = this.state;

      const encrypt = true;

      this.setState({ spinner: true });

      try {
        const xhr = await app.createAlbum(album_edit_name,
          selected_bucket.getBucketIdentifier(), encrypt);

        if (xhr.status === 200) {
          this.setAlertMessage('Album created');
          const { album_identifier } = unpackValue(xhr.response);
          await app.loadAlbumList(user);
          const redirect_url = `/album/${album_identifier}`;
          history.push(redirect_url);
        } else {
          this.setAlertError('Failed to create album. Please try later');
          this.setState({ album_edit_name: '', });
        }
        return xhr.status === 200;
      } catch (e) {
        console.log(e);
      } finally {
        this.setState({ spinner: false });
      }
      return false;
    }

    componentDidMount() {
      this.initSelectedAlbum();
    }

    componentDidUpdate = (prevProps) => {
      const { user, match } = this.props;

      if (prevProps.user !== user || prevProps.match !== match) {
        this.initSelectedAlbum();
      }
    }

    renderAlbumPanel(album) {
      const {
        album_edit_name,
        share_list_open,
      } = this.state;

      const album_name = album.getAlbumName();
      const last_update = (album.getMaxDate() === 0
        ? 'n/a'
        : formatHumanFriendlyDate(parseYMD(album.getMaxDate())));
      const num_files = album.getFileCount();
      const bucket_size = formatSize(album.getBucketSize());
      const bucket_name = getBucketNameFromIdentifier(
        album.getBucketIdentifier(), this.props.buckets
      );

      const share_list = album.getAlbumShareList().map(s => (
        <div key={s.email_to} className="album-share-list-item">
          <div className="album-share-list-item-email">
            {s.email_to}
            &nbsp;
            &nbsp;
            {s.can_add_files === 1 && <c.WhitePill title="User Can Add Files">A</c.WhitePill>}
          </div>
          <c.MenuButton
            title="Stop sharing with this user"
            icon={<icon.IconCrossX />}
            onClick={() => this.handleStopShare(s.email_to)}
          />
        </div>
      ));

      const share_list_length = share_list.length;

      return (
        <>
          <div className="main-form">
            <div className="form-title">Album Settings</div>
            <div className="album-name-edit-wrapper">
              <c.TextInput
                test_id="album-name"
                label="ALBUM NAME"
                onChange={ev => this.setState({ album_edit_name: ev.target.value })}
                value={album_edit_name}
              />
              {album_edit_name !== album_name && (
                <div className="album-name-edit-buttons">
                  <c.MenuButton
                    title="Save"
                    icon={<icon.IconCheck width="28" height="28" />}
                    onClick={this.handleUpdateAlbum}
                  />
                  <c.MenuButton
                    title="Cancel"
                    icon={(
                      <div style={{ display: 'inline-block', margin: '5px' }}>
                        <icon.IconCrossX width="16" height="16" />
                      </div>
                    )}
                    onClick={() => this.setState(
                      { album_edit_name: album.getAlbumName() }
                    )}
                  />
                </div>
              )
              }
            </div>

            <c.StaticText label="LAST UPDATE">
              {last_update}
            </c.StaticText>
            <c.StaticText label="SPACE">
              {bucket_size}, {num_files} files
            </c.StaticText>
            <c.StaticText label="LOCATION">
              {bucket_name}
            </c.StaticText>

            {share_list_length > 0 && (
              <c.DropdownList
                onClick={this.handleShareListClick}
                open={share_list_open}
                custom_items={share_list}
                label="SHARE STATUS"
                value={`SHARED WITH ${share_list_length} PEOPLE`}
              />
            )}

            {share_list_length === 0 && (
              <c.StaticText label="SHARE STATUS">Not shared</c.StaticText>
            )}

            <c.SuperWhiteButton
              onClick={this.handleShareClick}
              title="SHARE"
            />

            {/* <c.WhiteButton
                style={{margin: "1rem 0"}}
                onClick={
                    () => this.props.history.push(`/view/${album.getAlbumIdentifier()}`)
                }
                title="VIEW ALBUM" /> */}

            <c.DangerButton
              style={{ margin: '1rem 0' }}
              onClick={this.handleDeleteClick}
              title="DELETE ALBUM"
            />
          </div>
        </>
      );
    }

    renderNewAlbumPanel() {
      const { albums, buckets } = this.props;

      const {
        album_edit_name,
        bucket_list_open,
        selected_bucket,
        spinner,
      } = this.state;

      const bucketDisplayName = b => b.getBucketName();

      const bucket_name_list = buckets.map(b => ({ label: bucketDisplayName(b), bucket: b }));
      const selected_bucket_name = bucketDisplayName(selected_bucket);

      const dup_name = albums.filter(a => a.getAlbumName() === album_edit_name).length > 0;

      return (
        <>
          <div className="main-form">
            <div className="form-title">New Album</div>

            <c.TextInput
              test_id="album-name"
              label="ALBUM NAME"
              onChange={ev => this.setState({ album_edit_name: ev.target.value })}
              value={album_edit_name}
              red_text={dup_name && 'DUPLICATE ALBUM NAME'}
            />
            <c.DropdownList
              onClick={this.handleBucketListClick}
              open={bucket_list_open}
              label="STORAGE OPTION"
              items={bucket_name_list}
              value={selected_bucket_name}
            />
            <c.WhiteButton
              disabled={dup_name || album_edit_name.length === 0}
              onClick={this.handleCreateAlbum}
              title={spinner ? 'PLEASE WAIT...' : 'CREATE ALBUM'}
            />
          </div>
        </>
      );
    }

    renderForeignAlbumPanel(album) {
      const { history } = this.props;
      const album_name = album.getAlbumName();
      const owner_email = album.getOwnerEmail();

      return (
        <>
          <div className="main-form">
            <div className="form-title">Album Settings</div>

            <c.StaticText label="ALBUM NAME">
              {album_name}
            </c.StaticText>

            <c.StaticText label="OWNER">
              {owner_email}
            </c.StaticText>

            <c.DangerButton
              onClick={this.handleRejectForeignAlbum}
              title="REJECT ALBUM"
            />
            <c.WhiteButton
              style={{ marginTop: '1rem' }}
              onClick={() => history.push(`/view/${album.getAlbumIdentifier()}`)}
              title="BACK"
            />
          </div>
        </>
      );
    }

    renderDeleteNotEmpty(album) {
      return (
        <>
          <div className="main-form">
            <div className="form-title">Delete Album</div>

            <c.StaticText>
              Album {album.getAlbumName()} is not empty. <br />Please delete all files
              before deleting the album
            </c.StaticText>

            <c.WhiteButton
              onClick={() => this.setState({ mode: this.PAGE_MODE_DEFAULT })}
              title="BACK"
            />
          </div>
        </>
      );
    }

    renderSharePanel(/* album */) {
      const {
        share_email_address,
        share_allow_add_files,
      } = this.state;

      return (
        <>
          <div className="main-form">
            <div className="form-title">Share Album</div>

            <div>
              Please enter e-mail address of the person you want to share with
            </div>

            <c.TextInput
              test_id="share-album-email"
              label="EMAIL ADDRESS"
              onChange={ev => this.setState({
                share_email_address: ev.target.value
              })}
              value={share_email_address}
            />

            <c.Checkbox
              checked={share_allow_add_files}
              onClick={ev => this.setState({
                share_allow_add_files: ev.target.checked
              })}
            >
              Let this user add photos &amp; videos
            </c.Checkbox>

            <c.SuperWhiteButton
              disabled={!validateEmail(share_email_address)}
              onClick={this.handleDoShare}
              title="SHARE"
            />
            <c.WhiteButton
              style={{ marginTop: '1rem' }}
              onClick={() => this.setState({ mode: this.PAGE_MODE_DEFAULT })}
              title="CANCEL"
            />
          </div>
        </>
      );
    }

    renderInvitePanel(/* album */) {
      const { share_email_address } = this.state;

      return (
        <>
          <div className="main-form">
            <div className="form-title">Invite</div>

            <div>
              The email address <b>{share_email_address}</b> is not registered
              on the platform.
            </div>
            <div style={{ marginTop: '2rem' }}>
              You can now invite the user to register and repeat sharing the
              album, once the user is registered.
            </div>

            <c.TextInput
              label="EMAIL ADDRESS"
              onChange={ev => this.setState({ share_email_address: ev.target.value })}
              value={share_email_address}
            />

            <c.SuperWhiteButton
              disabled={!validateEmail(share_email_address)}
              onClick={this.handleInviteUser}
              title="SEND INVITE EMAIL"
            />

            <c.WhiteButton
              style={{ marginTop: '1rem' }}
              onClick={() => this.setState(
                { mode: this.PAGE_MODE_DEFAULT, share_email_address: '' }
              )}
              title="CANCEL"
            />
          </div>
        </>
      );
    }

    renderDeletedConfirm() {
      const { albums, history } = this.props;

      const no_albums = albums.length === 0;
      const url = no_albums ? '/account' : `/album/${albums[0].getAlbumIdentifier()}`;

      return (
        <>
          <div className="main-form">
            <div className="form-title">Album Deleted</div>

            {no_albums && <div>You do not have any albums left</div>}

            <c.WhiteButton
              onClick={() => history.push(url)}
              title="OK"
            />
          </div>
        </>
      );
    }

    // eslint-disable-next-line consistent-return
    renderPanel(album, mode) {
      // eslint-disable-next-line default-case
      switch (mode) {
        case this.PAGE_MODE_DEFAULT:
          if (album.getOwnerEmail() === '') {
            return this.renderAlbumPanel(album);
          } else {
            return this.renderForeignAlbumPanel(album);
          }
        case this.PAGE_MODE_DELETE_NOT_EMPTY:
          return this.renderDeleteNotEmpty(album);
        case this.PAGE_MODE_DELETED_CONFIRM:
          return this.renderDeletedConfirm(album);
        case this.PAGE_MODE_SHARE:
          return this.renderSharePanel(album);
        case this.PAGE_MODE_INVITE:
          return this.renderInvitePanel(album);
        case this.PAGE_MODE_NEW_ALBUM:
          return this.renderNewAlbumPanel();
      }
    }

    render() {
      const {
        user,
        app,
        // buckets,
        albums,
        match
      } = this.props;
      const { album_ident } = match.params;

      const {
        album,
        mode,
        selected_bucket,
      } = this.state;

      if (!user.getAuth()
        || (album_ident !== 'new' && !album)
        || (album_ident === 'new' && selected_bucket == null)) {
        return <></>;
      }

      const show_side_menu = app.getShowSideMenu();
      // const main_panel_class =
      //    show_side_menu ? 'main-panel-with-menu' : 'main-panel-centered';

      return (
        <>
          { this.renderAlert() }
          <div className="main">
            <m.TopBar
              user={user}
              app={app}
              album={album}
              upload={album_ident !== 'new'}
              view={album_ident !== 'new'}
            />
            {show_side_menu && (
              <m.SideMenu
                user={user}
                app={app}
                albums={albums}
                onClose={() => app.setShowSideMenu(false)}
                active={album && album_ident !== 'new' && album.getAlbumIdentifier()}
              />
            )}

            <div className="main-panel-centered">
              <div className="main-signup-panel">
                { this.renderPanel(album, mode) }
              </div>
            </div>
          </div>
        </>
      );
    }
}

export const AlbumPage = withRouter(AlbumPageComponent);
