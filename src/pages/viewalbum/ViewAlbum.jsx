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

/* eslint-disable prefer-template */
/* eslint-disable no-use-before-define */
/* eslint-disable import/prefer-default-export */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-else-return */
/* eslint-disable no-shadow */
/* eslint-disable react/jsx-boolean-value */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable class-methods-use-this */
/* eslint-disable jsx-a11y/media-has-caption */
/* eslint-disable prefer-destructuring */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-mixed-operators */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-bitwise */
/* eslint-disable lines-between-class-members */

import React from 'react';

import { LoadingScreen } from '../../components/WaitForValidUser';
import { Page } from '../Page';
import { ImageThumbItem } from './ImageThumbItem';
import { TextItem } from './TextItem';
import { DateHeader, getDateHeaderId } from './DateHeader';
import * as streamutils from '../../library/StreamUtils';
import { TopBar, SideMenu } from '../../components/Menu';
import * as icon from '../../components/Icons';

import * as platform from '../../library/Platform';
import * as settings from '../../library/Settings.ts';


import {
  uploadTextFile,
  createTextFile,
  sameYMD,
  mimeTypeFromFilename,
  mergeFileListsForTimeline,
  STOCK_FILE_TYPE_TEXT,
  STOCK_FILE_TYPE_IMAGE,
  STOCK_FILE_TYPE_VIDEO,
  MEDIA_TYPE_VIDEO,
} from '../../library/File';

import {
  packValue,
  packAndSymmetricEncryptValue,
  unpackValue,
} from '../../library/Pack';

import {
  formatDate,
  formatSize,
  parseYMD,
} from '../../library/Format';

import * as c from '../../components/Controls';

import * as crypto from '../../library/Crypto';

import {
  apiFileList,
  apiFileSetComment,
  apiDeleteFile,
  apiBulkDeleteFiles,
  apiFileSetPosition,
  apiFileDownloadToken,
  apiFileCreateDirectLink,
  apiAlbumActiveDayList,
} from '../../library/Api';

import { httpGetBinary } from '../../library/Req';
import { DirectLinkDialog, ConfirmDeleteDialog } from './ViewAlbumDialogs';

function getFileURL(app, stock_file, album, download_url, download_auth) {
  return getURLForBucketPath(
    album, download_url, download_auth, stock_file.getBucketPath()
  );
}

function getURLForBucketPath(album, download_url, download_auth, bucket_path) {
  const bucket_name = album.getBucketName();
  return (download_url + '/file/' + bucket_name + '/' + bucket_path
    + '?Authorization=' + download_auth);
}

function getThumbURL(app, stockFile, album, download_url, download_auth) {
  const bucket_name = album.getBucketName();
  return (download_url + '/file/' + bucket_name + '/' + stockFile.getThumbBucketPath()
    + '?Authorization=' + download_auth);
}

function isSameDay(d1, d2) {
  return (
    d1.getDate() === d2.getDate()
    && d1.getMonth() === d2.getMonth()
    && d1.getYear() === d2.getYear()
  );
}

export class ViewAlbumPage extends Page {
  PAGE_MODE_DEFAULT = 0;
  PAGE_MODE_LARGE_VIEW = 1;
  PAGE_MODE_ACCEPT_SHARED_ALBUM = 2;
  PAGE_MODE_ERROR_NO_SERVICE_WORKER = 3;
  PAGE_MODE_FREE_ACCOUNT_NO_ALBUMS = 4;

  PAGE_DIALOG_NONE = 0;
  PAGE_DIALOG_CONFIRM_DELETE_SELECTION = 1;

  LARGE_VIEW_MENU_HIDDEN = 0;
  LARGE_VIEW_MENU_SHOW = 1;
  LARGE_VIEW_DIALOG_DIRECT_LINK = 2;
  LARGE_VIEW_EDIT_IMAGE_COMMENT = 3;
  LARGE_VIEW_DIALOG_CONFIRM_DELETE = 4;

  ALBUM_SHARE_RESPONSE_ACCEPT = 'accept';
  ALBUM_SHARE_RESPONSE_BLOCK = 'block';
  ALBUM_SHARE_RESPONSE_REJECT = 'reject';

  THUMB_SIZE_22 = '22'; // 3 thumbs in row
  THUMB_SIZE_11 = '11'; // 6 thumbs in row

    SETTING_NAME_THUMB_SIZE = 'viewalbum.thumb_size';

    constructor(props) {
      super(props);

      const thumb_size_setting = settings.getSetting(this.SETTING_NAME_THUMB_SIZE);

      this.state = {
        files: null,
        album: null,
        focus_item: null,
        edit_item: null,
        move_items: [],
        selected_items: [],
        mode: this.PAGE_MODE_DEFAULT,
        dialog: this.PAGE_DIALOG_NONE,
        large_view_item_index: null,
        large_view_main_image_avail: false,
        large_view_menu_mode: false,
        large_view_item_direct_link: null,
        large_view_video_autoplay: false,
        large_view_video_show_wait_message: false,
        large_view_show_nav_buttons: platform.isHoverAvailable(),
        maybe_has_more_newer_files: true,
        yyyymmdd: null,
        cal_year: null,
        cal_month: null,
        cal_day: null,
        active_days: {}, // days with medias
        download_list: [], // list of files currently downloading
        play_list: [], // list of video files currently being prepared for playback
        // eslint-disable-next-line no-nested-ternary
        thumb_size: thumb_size_setting == null
          ? (platform.getRootWidth() >= 1440 ? this.THUMB_SIZE_11 : this.THUMB_SIZE_22)
          : thumb_size_setting,
      };

      this.observer = new IntersectionObserver(this.fileObserverCallback, {});
      this.observe_files = true;
      this.main_div_ref = null;

      // this is set when we need scroll to a newly added element
      this.scroll_into_view_id = null;

      // this is set when we need to return to a saved scroll position
      // either after returning from a large view or after adding elements
      // above the element
      this.saved_scroll_position = null;

      // if true, componentDidUpdate will forcedly reload album info
      // currently this is done after accepting shared album
      this.force_update_album = false;

      // large view inactivity timer
      this.large_view_timer = null;

      // genstures on mobile
      this.touch_start_ev = null;
      this.touch_move_ev = null;
    }

    // setState(s, c) {
    //     console.log("setState", s);
    //     console.trace();
    //     React.Component.prototype.setState.call(this, s, c);
    // }

    handleTouchEnd() {
      if (this.touch_start_ev === null || this.touch_move_ev === null) {
        return;
      }

      const sx = this.touch_start_ev.clientX;
      const sy = this.touch_start_ev.clientY;
      const x = this.touch_move_ev.clientX;
      const y = this.touch_move_ev.clientY;
      const dx = x - sx;
      const abs_dx = Math.abs(dx);
      const dy = y - sy;

      if (abs_dx < 50 || Math.abs(dy) > abs_dx) {
        this.touch_start_ev = null;
        this.touch_end_ev = null;
        return;
      }

      this.touch_start_ev = null;
      this.touch_end_ev = null;
      /* await */ this.handleLargeViewNavClick(dx > 0);
    }

    setFocusItem(item) {
      const { focus_item } = this.state;
      if (focus_item != null) {
        focus_item.setState({ mode: focus_item.MODE_DEFAULT });
      }
      this.setState({ focus_item: item });
    }

    addFileToDownloadList = (stock_file) => {
      const { download_list } = this.state;
      download_list.push(stock_file);
      this.setState({ download_list });
    }

    isFileDownloaded = (stock_file) => {
      const { download_list } = this.state;
      return download_list.filter(f => f === stock_file).length > 0;
    }

    removeFileFromDownloadList = (stock_file) => {
      const { download_list } = this.state;
      this.setState({ download_list: download_list.filter(f => f !== stock_file) });
    }

    addFileToPlayList = (stock_file) => {
      const { play_list } = this.state;
      play_list.push(stock_file);
      this.setState({ play_list });
    }

    isFilePlayed = (stock_file) => {
      const { play_list } = this.state;
      return play_list.filter(f => f === stock_file).length > 0;
    }

    removeFileFromPlayList = (stock_file) => {
      const { play_list } = this.state;
      this.setState({ play_list: play_list.filter(f => f !== stock_file) });
    }


    ensureYearActiveDaysLoaded = async (year) => {
      const { album, active_days } = this.state;
      if (active_days[year] === undefined) {
        const res = await apiAlbumActiveDayList(album.getAlbumIdentifier(), year);
        active_days[res[0].year] = res[0].days;
        this.setState({ active_days: Object.assign({}, active_days) });
      }
    }

    setActiveDay = async (yyyymmdd) => {
      const cal_year = (yyyymmdd / 10000) | 0;
      const cal_month = ((yyyymmdd % 10000) / 100 | 0) - 1;
      const cal_day = (yyyymmdd % 100) | 0;

      this.setState({
        yyyymmdd,
        cal_year,
        cal_month,
        cal_day
      });
      await this.ensureYearActiveDaysLoaded(cal_year);
    }

    loadFileData(reverse) {
      const { album, files } = this.state;
      const arr = reverse ? files.slice().reverse() : files;
      for (const f of arr) {
        if (!f.getDataLoaded() && !f.getDataLoadInProgress()) {
          /* await */ this.loadAndDecryptFile(album, f);
        }
      }
    }

    fileObserverCallback = async (entries) => {
      if (!this.observe_files) {
        return;
      }

      const { app } = this.props;
      const { album, files, maybe_has_more_newer_files } = this.state;

      await app.getAlbumDownloadAuth(album.getAlbumIdentifier());

      let max_file_index = -1;
      let min_file_index = 10000000;

      for (const e of entries) {
        if (e.intersectionRatio === 0) {
          continue;
        }

        const file_id = e.target.id;
        const findex = files.findIndex(f => f.getFileIdentifier() === file_id);
        if (findex === -1) {
          continue;
        }

        max_file_index = Math.max(max_file_index, findex);
        min_file_index = Math.min(min_file_index, findex);
      }

      const threshold = 15;
      if (max_file_index >= 0 && files.length - max_file_index < threshold) {
        this.observe_files = false;
        // if we are too close to the end of file list, try to load more files
        await this.loadAlbumOlderFiles();
        this.observe_files = true;
      }

      if (this.main_div_ref != null
        && files.length > 0
        && min_file_index < threshold
        && maybe_has_more_newer_files) {
        // if we are too close to the start, load more newer files, and keep
        // currently visible files from being scrolled down

        const saved_scroll_position = {
          component: this,
          scroll_top: this.main_div_ref.scrollTop,
          scroll_height: this.main_div_ref.scrollHeight,
          num_files: files.length,
        };

        let request_counter = 0;

        const animateScroll = () => {
          const {
            component,
            scroll_top,
            scroll_height,
            num_files
          } = saved_scroll_position;
          if (component.state.files.length > num_files) {
            const new_height = this.main_div_ref.scrollHeight;
            const new_top = scroll_top + (new_height - scroll_height);
            this.main_div_ref.scrollTop = new_top;
            this.saved_scroll_position = null;
          } else if (request_counter < 60) {
            request_counter += 1;
            window.requestAnimationFrame(animateScroll);
          }
        };

        window.requestAnimationFrame(animateScroll);

        await this.loadAlbumNewerFiles();
      }
    }

    gotoLargeView = async (album, item) => {
      if ((navigator.serviceWorker == null || navigator.serviceWorker.controller == null)
        && item.getFileType() === STOCK_FILE_TYPE_VIDEO) {
        this.setState({ mode: this.PAGE_MODE_ERROR_NO_SERVICE_WORKER });
        return;
      }

      // NOTE: the zoom path is not file-specific for two reasons:
      // 1. when user hits "back" in the zoom view, they usually mean "go back to tiles",
      // not "go back to the previous picture".
      // 2. having file identifier could make it tempting to share this link, but the link
      // is not shareable

      await this.setStatePromise({
        large_view_item_index: this.state.files.indexOf(item),
        large_view_video_show_wait_message: true,
      });

      this.props.history.push(`/zoom/${album.getAlbumIdentifier()}`);
    }

    async handleStartLargeView(item) {
      const { app } = this.props;
      const { files, album } = this.state;

      app.setShowSideMenu(false);

      const hover_avail = platform.isHoverAvailable();

      await this.setStatePromise({
        mode: this.PAGE_MODE_LARGE_VIEW,
        large_view_item_index: files.indexOf(item),
        large_view_main_image_avail: item.getImageDataURL() != null,
        large_view_show_nav_buttons: hover_avail,
      });

      if (hover_avail) {
        this.handleLargeViewMouseActivity();
      }

      if (item.getFileType() === STOCK_FILE_TYPE_VIDEO) {
        this.handlePlayVideo(item);
      } else {
        /* const main_image_promise = */ this.loadAndDecryptMainImage(album, item, false);
        // const index_info_promise = app.loadFileIndexInfo(album, stock_file);
        // await Promise.all([main_image_promise, index_info_promise]);

        // await main_image_promise;
      }
    }

    handleStartMovingThumbs = (file_list) => {
      this.setState({ move_items: file_list, selected_items: [] });
    }

    handleCancelMoveThumb = () => {
      this.setState({ move_items: [] });
    }

    handleClickPositionMarker = async (file, is_left) => {
      const { files, move_items } = this.state;

      const source_identifier_list = move_items.map(item => item.getFileIdentifier());
      const target_identifier = file.getFileIdentifier();

      this.setState({ move_items: [] });

      const pack = packValue({
        source_file_list: source_identifier_list,
        target_file: target_identifier,
        position_before: (is_left ? 1 : 0),
      });

      const xhr = await apiFileSetPosition(pack);

      if (xhr.status === 200) {
        for (const move_item of (is_left ? move_items : move_items.reverse())) {
          const source_index = files.indexOf(move_item);
          files.splice(source_index, 1);

          const target_index = files.indexOf(file);
          files.splice(target_index + (is_left ? 0 : 1), 0, move_item);

          move_item.setDate(file.getDate());
        }

        this.setState({ files: files.map(f => f) });
      } else {
        this.setAlertError('Move failed. Please try again later');
      }
    }

    handleAddText = (file, above) => {
      // if there's already a new text block, cancel it
      const { files } = this.state;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existing_new = files.filter(f => f.getFileIdentifier() === 0);
        if (existing_new.length === 0) {
          break;
        }
        files.splice(files.indexOf(existing_new[0]), 1);
      }

      const f = createTextFile(file.getDate());
      const index = files.indexOf(file);
      files.splice(index + (above ? 0 : 1), 0, f);

      this.setState({
        files: files.map(f => f),
        edit_item: f,
      });
    }

    handleSaveImageComment = async (file, edit_comment) => {
      const { album } = this.state;
      const encrypted = album.getEncrypted();

      let pack;

      if (encrypted) {
        const file_key = file.getFileKey();
        const encrypted_text = crypto.symmetricEncrypt(file_key, edit_comment);

        pack = packValue({
          file: file.getFileIdentifier(),
          comment: encrypted_text,
        });
      } else {
        pack = packValue({
          file: file.getFileIdentifier(),
          comment: edit_comment,
        });
      }

      const xhr = await apiFileSetComment(pack);

      if (xhr.status === 200) {
        file.setComment(edit_comment);
      } else {
        this.setAlertError('Comment save failed. Please try later');
      }
    }

    handleSaveText = async (file, edit_text) => {
      const { app, user } = this.props;
      const { album, files } = this.state;
      const index = files.indexOf(file);
      let xhr;

      if (file.getFileIdentifier() === 0) { // new paragraph file
        if (edit_text.length === 0) {
          return; // do not create empty text paragraph
        }

        let after_identifier = '';

        if (index > 0) {
          // if the previous file has the same date,
          // set ordering after the previous file
          if (sameYMD(file.getDate(), files[index - 1].getDate())) {
            after_identifier = files[index - 1].getFileIdentifier();
          }
        }

        xhr = await uploadTextFile(
          app, user, album, file, edit_text, after_identifier
        );

        if (xhr.status === 200) {
          const resppack = unpackValue(xhr.response);
          file.setFileIdentifier(resppack.file.identifier);
          this.setState({ edit_item: null });
        }
      } else {
        if (edit_text.length === 0) {
          // delete paragraph if the new text is empty
          await apiDeleteFile(file);
          // this.handleSetEditMode(null, "view");
          this.setState({
            files: files.filter(f => f !== file),
            edit_item: null,
          });
          return;
        }

        const encrypted = album.getEncrypted();
        let upload_text;

        if (encrypted) {
          const file_key = file.getFileKey();
          upload_text = crypto.symmetricEncrypt(file_key, edit_text);
        } else {
          upload_text = edit_text;
        }

        const pack = packValue({
          file: file.getFileIdentifier(),
          comment: upload_text,
        });

        xhr = await apiFileSetComment(pack);
      }

      if (xhr.status === 200) {
        file.setComment(edit_text);
        this.setState({ edit_item: null });
      } else {
        this.setAlertError('Save failed. Please try again later');
      }
    }

    handleCancelEditText = (file) => {
      const { files } = this.state;

      if (file.getFileIdentifier() === 0) { // new paragraph file
        const index = files.indexOf(file);
        files.splice(index, 1);
      }

      this.setState({
        files: files.map(f => f),
        edit_item: null,
      });
    }

    handleDeleteFile = async (stock_file) => {
      const { app } = this.props;
      const { album, files } = this.state;

      const new_files = files.filter(f => f !== stock_file);

      this.setState({
        files: new_files,
      });

      // make sure index info is loaded for STOCK_FILE_TYPE_VIDEO
      if (stock_file.getFileType() === STOCK_FILE_TYPE_VIDEO) {
        if (stock_file.getIndexInfo(MEDIA_TYPE_VIDEO) == null) {
          /* const index_loaded = */ await app.loadFileIndexInfo(album, stock_file);
          // could happen after an unsuccessful upload, proceed with delete anyway
          /* if (!index_loaded) {
              this.setAlertError("Delete failed. Please try later");
              return;
          } */
        }
      }

      let success = true;

      try {
        success = await apiDeleteFile(stock_file);
      } catch (e) {
        console.error(e);
        success = false;
      }

      if (!success) {
        this.setAlertError('Delete failed. Please try again later');
      }

      return new_files;
    }

    handleItemSelectClick = (item) => {
      const { selected_items } = this.state;
      if (selected_items.includes(item)) {
        this.setState({ selected_items: selected_items.filter(x => x !== item) });
      } else {
        this.setState({ selected_items: selected_items.concat(item) });
      }
    }

    handleDeleteSelectedItems = async () => {
      const { app } = this.props;
      const { selected_items, album, files } = this.state;

      this.setState({
        files: files.filter(f => !selected_items.includes(f)),
        selected_items: [],
        mode: this.PAGE_MODE_DEFAULT,
      });

      const remaining_item_count = files.length - selected_items.length;

      const index_info_promises = [];

      for (const f of selected_items) {
        // try load sure index info for STOCK_FILE_TYPE_VIDEO
        if (f.getFileType() === STOCK_FILE_TYPE_VIDEO) {
          if (f.getIndexInfo(MEDIA_TYPE_VIDEO) == null) {
            index_info_promises.push(app.loadFileIndexInfo(album, f));

            // could happen after an unsuccessful upload, proceed with delete anyway
            /* if (!index_loaded) {
                this.setAlertError("Delete failed. Please try later");
                return;
            } */
          }
        }
      }

      await Promise.all(index_info_promises).catch(e => console.error(e));
      const xhr = await apiBulkDeleteFiles(selected_items);
      if (xhr.status === 200) {
        this.setAlertMessage(`Deleted ${selected_items.length} items`);
      } else {
        this.setAlertError('Delete failed. Please try later');
      }

      if (remaining_item_count < 50) {
        if (remaining_item_count > 0) { // otherwise apiLoadFiles will be called twice
          /* await */ this.loadAlbumNewerFiles();
        }
        /* await */ this.loadAlbumOlderFiles();
      }
    }

    handleCalendarClick = async (el_type, value) => {
      if (el_type === 'years') {
        // eslint-disable-next-line prefer-const, no-unused-vars
        let { cal_year, cal_month, cal_day } = this.state;
        if (value === 'chevron-left') {
          cal_year -= 1;
        } else {
          cal_year += 1;
        }
        this.setState({ cal_year, cal_month, cal_day: null });
        await this.ensureYearActiveDaysLoaded(cal_year);
      } else if (el_type === 'months') {
        // eslint-disable-next-line prefer-const, no-unused-vars
        let { cal_year, cal_month, cal_day } = this.state;

        if (value === 'chevron-left') {
          if (cal_month === 0) {
            cal_month = 11;
            cal_year -= 1;
          } else {
            cal_month -= 1;
          }
          this.setState({ cal_year, cal_month, cal_day: null });
          await this.ensureYearActiveDaysLoaded(cal_year);
        } else if (value === 'chevron-right') {
          if (cal_month === 11) {
            cal_month = 0;
            cal_year += 1;
          } else {
            cal_month += 1;
          }
          this.setState({ cal_year, cal_month, cal_day: null });
          await this.ensureYearActiveDaysLoaded(cal_year);
        } else if (value.month > cal_month) {
          if (value.month === cal_month + 1) {
            // same year
            this.setState({ cal_month: value.month, cal_day: null });
          } else {
            // previous year
            this.setState({
              cal_year: cal_year - 1, cal_month: value.month, cal_day: null
            });
            await this.ensureYearActiveDaysLoaded(cal_year - 1);
          }
        } else if (value.month < cal_month) {
          if (value.month === cal_month - 1) {
            // same year
            this.setState({ cal_month: value.month, cal_day: null });
          } else {
            // next year
            this.setState({
              cal_year: cal_year + 1, cal_month: value.month, cal_day: null
            });
            await this.ensureYearActiveDaysLoaded(cal_year + 1);
          }
        }
      } else if (el_type === 'days') {
        if (value.selected || !value.active) {
          return;
        }

        const { files, album } = this.state;

        const { year, month, label } = value;
        const yyyymmdd = year * 10000 + (month + 1) * 100 + label;
        await this.setActiveDay(yyyymmdd);

        const d = parseYMD(yyyymmdd);

        const newest_file = files[0];
        const oldest_file = files[files.length - 1];

        const newest_date = newest_file.getDate();
        const oldest_date = oldest_file.getDate();

        this.setState({ maybe_has_more_newer_files: true });

        // same format as in this.renderDate()
        const date_element_id = getDateHeaderId(year, month, label);

        if (d > newest_date || d < oldest_date) {
          await this.loadAlbumFiles(album, yyyymmdd);
          await this.loadAlbumNewerFiles();
          window.requestAnimationFrame(() => {
            const el = document.getElementById(date_element_id);
            el.scrollIntoView(true);
          });
        } else if (newest_date.getFullYear() === year
          && newest_date.getMonth() === month
          && newest_date.getDate() === label
        ) {
          await this.loadAlbumNewerFiles();
          window.requestAnimationFrame(() => {
            const el = document.getElementById(date_element_id);
            el.scrollIntoView(true);
          });
        } else if (oldest_date.getFullYear() === year
          && oldest_date.getMonth() === month
          && oldest_date.getDate() === label
        ) {
          await this.loadAlbumOlderFiles();
          window.requestAnimationFrame(() => {
            const el = document.getElementById(date_element_id);
            el.scrollIntoView(true);
          });
        } else {
          const el = document.getElementById(date_element_id);
          if (el) {
            el.scrollIntoView(true);
          }
        }
      }
    }

    handlePlayVideo = async (stock_file) => {
      const { app } = this.props;
      const { album } = this.state;

      if (this.isFilePlayed(stock_file)) {
        return;
      }

      this.addFileToPlayList(stock_file);

      try {
        const album_identifier = album.getAlbumIdentifier();
        const file_key = stock_file.getFileKey();

        const index_loaded = await app.loadFileIndexInfo(album, stock_file);
        if (!index_loaded) {
          this.setAlertError('Download failed. Please try later');
          return;
        }

        const video_index_info = stock_file.getIndexInfo(MEDIA_TYPE_VIDEO);

        if (!video_index_info) {
          this.setAlertError('Download failed. Please try later');
          return;
        }

        navigator.serviceWorker.controller.postMessage({
          file_identifier: stock_file.getFileIdentifier(),
          file_key,
          video_index_info,
        });

        const { download_auth, download_url } = await app.getAlbumDownloadAuth(album_identifier);

        const file_url = getURLForBucketPath(album, download_url, download_auth,
          video_index_info.large_file_bucket_path);

        const stream_url = streamutils.buildVideoStreamURL(
          stock_file.getFileIdentifier(),
          file_url,
          video_index_info.index_list.length === 0 /* is_short */
        );

        stock_file.setVideoStreamURL(stream_url);
      } finally {
        this.removeFileFromPlayList(stock_file);
      }
    }

    handleDownloadVideo = async (stock_file) => {
      // this function is currently not used
      // TODO: it still uses StreamSaver, needs to be rewritten to use
      // the new service worker
      const { app } = this.props;
      const { album } = this.state;

      if (this.isFileDownloaded(stock_file)) {
        return;
      }

      this.addFileToDownloadList(stock_file);

      try {
        const album_identifier = album.getAlbumIdentifier();
        const file_key = stock_file.getFileKey();

        const index_loaded = await app.loadFileIndexInfo(album, stock_file);
        if (!index_loaded) {
          this.setAlertError('Download failed. Please try later');
          return;
        }

        const video_index_info = stock_file.getIndexInfo(MEDIA_TYPE_VIDEO);

        if (!video_index_info) {
          this.setAlertError('Download failed. Please try later');
          return;
        }

        const { download_auth, download_url } = await app.getAlbumDownloadAuth(album_identifier);

        const file_url = getURLForBucketPath(album, download_url, download_auth,
          video_index_info.large_file_bucket_path);

        // eslint-disable-next-line no-undef
        const file_stream = StreamSaver.createWriteStream(stock_file.getName());
        const writer = file_stream.getWriter();

        if (video_index_info.index_list.length > 0) {
          let enc_range_start = 0;
          let enc_range_end = 0;

          for (const ix of video_index_info.index_list) {
            enc_range_start = enc_range_end + ix.index_info_size;
            enc_range_end = enc_range_start + ix.encrypted_part_size;

            // NOTE: HTTP range header is inclusive
            const part_xhr = await httpGetBinary(file_url, {
              // eslint-disable-next-line quote-props
              'Range': `bytes=${enc_range_start}-${enc_range_end - 1}`
            });

            if (part_xhr.status !== 206 && part_xhr.status !== 200) {
              writer.close();
              this.setAlertError('Download failed. Please try later');
              return;
            }

            const encrypted_data = new Uint8Array(Buffer.from(part_xhr.response));
            const file_part = unpackValue(crypto.symmetricDecrypt(file_key, encrypted_data));
            writer.write(file_part.data);
          }
        } else {
          const file_contents_xhr = await httpGetBinary(file_url);
          const encrypted_data = new Uint8Array(Buffer.from(file_contents_xhr.response));
          const decrypted_data = crypto.symmetricDecrypt(file_key, encrypted_data);
          const contents_resppack = unpackValue(decrypted_data);
          writer.write(contents_resppack.file.data);
        }

        writer.close();
      } finally {
        this.removeFileFromDownloadList(stock_file);
      }
    }

    handleLargeViewNavClick = async (is_left) => {
      // eslint-disable-next-line prefer-const
      let { album, files, large_view_item_index } = this.state;

      const increment = is_left ? -1 : 1;
      let new_index = large_view_item_index + increment;

      let item = files[new_index];
      let item_file_type = item.getFileType();

      while (item_file_type !== STOCK_FILE_TYPE_IMAGE
        && item_file_type !== STOCK_FILE_TYPE_VIDEO
      ) {
        if (new_index === 0 && increment === -1) {
          const num_loaded_files = await this.loadAlbumNewerFiles();
          new_index += num_loaded_files - 1;
        } else {
          await this.loadAlbumOlderFiles();
          new_index += 1;
        }

        // eslint-disable-next-line prefer-destructuring
        files = this.state.files;
        item = files[new_index];
        item_file_type = item.getFileType();
      }

      if (item_file_type === STOCK_FILE_TYPE_IMAGE) {
        const avail = item.getImageDataURL() != null;

        await this.setStatePromise({
          large_view_item_index: new_index,
          large_view_main_image_avail: avail,
        });

        if (!avail) {
          await this.loadAndDecryptMainImage(album, item, false);
        }
      } else if (item_file_type === STOCK_FILE_TYPE_VIDEO) {
        const avail = item.getVideoStreamURL() != null;

        await this.setStatePromise({
          large_view_item_index: new_index,
          large_view_main_image_avail: true,
          large_view_video_show_wait_message: !avail,
        });

        if (!avail) {
          /* await */ this.handlePlayVideo(item);
        }
      }

      const threshold = 4;

      if (new_index < threshold) {
        const num_loaded_files = await this.loadAlbumNewerFiles();
        new_index += num_loaded_files;

        for (let i = Math.max(0, new_index - threshold); i < new_index; i += 1) {
          const f = this.state.files[i];
          /* await */ this.loadAndDecryptFile(album, f);
          /* await */ this.loadAndDecryptMainImage(album, f, false);
        }
      } else if (new_index > files.length - threshold) {
        // NOTE: this updates state.files
        await this.loadAlbumOlderFiles();

        for (let i = new_index + 1;
          i < Math.min(this.state.files.length, new_index + threshold); i += 1) {
          const f = this.state.files[i];
          /* await */ this.loadAndDecryptFile(album, f);
          /* await */ this.loadAndDecryptMainImage(album, f, false);
        }
      } else {
        for (let i = new_index - threshold; i < new_index + threshold; i += 1) {
          if (i < 0 || i === new_index) {
            continue;
          }
          if (i >= this.state.files.length) {
            break;
          }
          const f = this.state.files[i];
          /* await */ this.loadAndDecryptFile(album, f);
          /* await */ this.loadAndDecryptMainImage(album, f, false);
        }
      }
    }

    handleRespondSharedAlbum = async (album, response) => {
      const { app } = this.props;
      const success = await app.respondAlbumShare(album, response);

      if (success) {
        let text;

        // eslint-disable-next-line default-case
        switch (response) {
          case this.ALBUM_SHARE_RESPONSE_ACCEPT: text = 'Album accepted';
            break;
          case this.ALBUM_SHARE_RESPONSE_BLOCK: text = 'Album rejected';
            break;
          case this.ALBUM_SHARE_RESPONSE_REJECT: text = 'Album rejected and user blocked';
            break;
        }

        this.force_update_album = true;
        this.setAlertMessage(text);
      } else {
        this.setAlertError('Error. Please try later');
      }
      this.setState({ mode: this.PAGE_MODE_DEFAULT });
    }

    handleLargeViewContract = () => {
      const { files, large_view_item_index } = this.state;
      const ident = files[large_view_item_index].getFileIdentifier();
      this.scroll_into_view_id = ident;
      this.setState({ mode: this.PAGE_MODE_DEFAULT });
    }

    handleDateSelectedClick = (d, file_list_for_date, selected) => {
      const { selected_items } = this.state;

      const new_selected_items = selected_items.filter(item => !file_list_for_date.includes(item));
      if (selected) {
        this.setState({ selected_items: new_selected_items });
      } else {
        this.setState({ selected_items: new_selected_items.concat(file_list_for_date) });
      }
    }

    handleLargeViewMouseActivity = () => {
      if (this.large_view_timer) {
        clearTimeout(this.large_view_timer);
      }

      const { large_view_show_nav_buttons } = this.state;

      if (!large_view_show_nav_buttons) {
        this.setState({ large_view_show_nav_buttons: true });
      }

      this.large_view_timer = setTimeout(() => {
        this.large_view_timer = null;
        this.setState({ large_view_show_nav_buttons: false });
      }, 4000);
    }

    handleZoomIn = () => {
      this.setState({ thumb_size: this.THUMB_SIZE_22 });
      settings.setSetting(this.SETTING_NAME_THUMB_SIZE, this.THUMB_SIZE_22);
    }

    handleZoomOut = () => {
      this.setState({ thumb_size: this.THUMB_SIZE_11 });
      settings.setSetting(this.SETTING_NAME_THUMB_SIZE, this.THUMB_SIZE_11);
    }

    createDirectLink = async (stock_file) => {
      const { album } = this.state;
      const encrypted = album.getEncrypted();

      const download_token_promise = apiFileDownloadToken(stock_file);

      const url = crypto.digestSHA1(crypto.generateDirectFilePassword());
      let check = url;

      for (let i = 0; i < 1000; i += 1) {
        check = crypto.digestSHA1(check);
      }

      const link_key = '1' + check + url; // also serves as password

      const key = crypto.deriveDirectLinkKey(link_key);

      const download_token_xhr = await download_token_promise;
      if (download_token_xhr.status !== 200) {
        return null;
      }

      const download_token_pack = unpackValue(download_token_xhr.response);

      const direct_link_encrypted_data = packAndSymmetricEncryptValue(key, {
        download_url: download_token_pack.download_url,
        file_name: download_token_pack.file_name,
        file_download_auth: download_token_pack.file_download_auth,
        file_expires: download_token_pack.file_expires,
        thumb_name: download_token_pack.thumb_name,
        thumb_download_auth: download_token_pack.thumb_download_auth,
        thumb_expires: download_token_pack.thumb_expires,
        large_file_download_auth: download_token_pack.large_file_download_auth,
        large_file_expires: download_token_pack.large_file_expires,
        large_file_name: download_token_pack.large_file_name,
        key: encrypted ? stock_file.getFileKey() : 0,
        bucket_name: album.getBucketName(),
        encrypted,
      });

      const direct_link_pack = packValue({
        data: direct_link_encrypted_data,
        link_key,
        file_identifier: stock_file.getFileIdentifier(),
      });

      const direct_link_xhr = await apiFileCreateDirectLink(direct_link_pack);
      if (direct_link_xhr.status !== 200) {
        return null;
      }

      return `https://genta.app/dl/${url}`;
    }

    // load main image
    loadAndDecryptMainImage = async (album, f, preload) => {
      const t = f.getFileType();
      const encrypted = f.getEncrypted();

      const { files } = this.state;

      if ((t === STOCK_FILE_TYPE_IMAGE /* || t == STOCK_FILE_TYPE_VIDEO */)
        && f.getImageDataURL() == null) {
        const { app } = this.props;

        const mime_type = mimeTypeFromFilename(f.getName());

        const album_identifier = album.getAlbumIdentifier();
        const { download_auth, download_url } = await app.getAlbumDownloadAuth(album_identifier);

        const file_url = getFileURL(app, f, album, download_url, download_auth);

        if (encrypted) {
          const file_contents_xhr = await httpGetBinary(file_url);
          const encrypted_data = new Uint8Array(Buffer.from(file_contents_xhr.response));
          const decrypted_data = crypto.symmetricDecrypt(f.getFileKey(), encrypted_data);
          const contents_resppack = unpackValue(decrypted_data);
          const image_data = URL.createObjectURL(
            new Blob([contents_resppack.file.data], { type: mime_type })
          );
          f.setImageDataURL(image_data);
        } else {
          f.setImageDataURL(file_url);
        }

        const { large_view_item_index } = this.state;

        if (files[large_view_item_index] === f) {
          this.setState({ large_view_main_image_avail: true });
        }
      }

      // !preload means the current call is not a pre-loading, in which case
      // we speculatively pre-load images around (with preload=true to avoid
      // recursive calls)

      // TODO: fix this
      // eslint-disable-next-line no-constant-condition
      if (!preload && false) {
        const { files, slide_show_file } = this.state;
        const image_files = files.filter(f => f.getFileType() === STOCK_FILE_TYPE_IMAGE
          || f.getFileType() === STOCK_FILE_TYPE_VIDEO);
        const shown_index = image_files.indexOf(slide_show_file);
        const range = 5;

        for (let i = Math.max(shown_index - range, 0);
          i < Math.min(shown_index + range, image_files.length); i += 1) {
          /* await */ this.loadAndDecryptMainImage(album, image_files[i], true);
        }
      }
    }

    // for images, this only loads the thumbnail
    loadAndDecryptFile = async (album, f) => {
      // TODO: check if this function is sometimes called
      // for files which have the thumbnail already loaded

      try {
        f.setDataLoadInProgress(true);

        const t = f.getFileType();
        const encrypted = album.getEncrypted();

        if (t === STOCK_FILE_TYPE_IMAGE || t === STOCK_FILE_TYPE_VIDEO) {
          const { app } = this.props;

          const album_identifier = album.getAlbumIdentifier();
          const { download_auth, download_url } = await app.getAlbumDownloadAuth(album_identifier);

          const file_url = getThumbURL(app, f, album, download_url, download_auth);

          const index_loaded = (t === STOCK_FILE_TYPE_VIDEO)
            ? await app.loadFileIndexInfo(album, f)
            : false;

          // f.setDownloadURL(file_url);
          if (encrypted) {
            const file_contents_xhr = await httpGetBinary(file_url);
            const encrypted_data = new Uint8Array(Buffer.from(file_contents_xhr.response));
            const decrypted_data = crypto.symmetricDecrypt(f.getFileKey(), encrypted_data);
            const contents_resppack = unpackValue(decrypted_data);
            const image_data = URL.createObjectURL(
              new Blob([contents_resppack.thumb.data], { type: 'image/jpeg' })
            );

            f.setThumbDataURL(image_data);
          } else { // clear
            f.setThumbDataURL(file_url);

            // for clear video files, load authorized URL of the main video file
            // NOTE: when streaming videos is supported, this should be URL of the
            // streaming video file
            if (t === STOCK_FILE_TYPE_VIDEO && index_loaded) {
              const video_index_info = f.getIndexInfo(MEDIA_TYPE_VIDEO);
              const file_url = getURLForBucketPath(
                album,
                download_url,
                download_auth,
                video_index_info.large_file_bucket_path
              );
              video_index_info.clear_download_url = file_url;
            }
          }
          f.setDataLoaded();
        }

        if (this.state.files !== null) {
          this.setState({ loaded: this.state.files.map(f => f.getDataLoaded()) });
        }
      } catch (err) {
        console.error(err);
      } finally {
        f.setDataLoadInProgress(false);
      }
    }

    loadAlbumFiles = async (album, yyyymmdd) => {
      if (yyyymmdd != null) {
        const file_list = await apiFileList(album, yyyymmdd, null);
        await this.setStatePromise({ files: file_list, album });
        await this.setActiveDay(yyyymmdd);
        this.loadFileData();
        return;
      }

      // if no date specified, then load more files
      await this.loadAlbumOlderFiles();
    }

    loadAlbumOlderFiles = async () => {
      const { album, files } = this.state;
      const len = files.length;

      if (len > 0) {
        const file_list = await apiFileList(album, null, files[len - 1].getFileIdentifier(), false);
        // eslint-disable-next-line arrow-body-style
        this.setState((state) => {
          return { files: mergeFileListsForTimeline(state.files, file_list) };
        });
      } else {
        const file_list = await apiFileList(album, null, null, false);
        this.setState({ files: file_list });
      }

      this.loadFileData();
    }

    loadAlbumNewerFiles = async () => {
      const { large_view_item_index, album, files } = this.state;
      const file_identifier = files.length > 0 ? files[0].getFileIdentifier() : null;
      const file_list = await apiFileList(album, null, file_identifier, true);

      this.setState((state) => {
        const merged_files = mergeFileListsForTimeline(state.files, file_list);
        const new_file_count = merged_files.length - state.files.length;

        return {
          files: merged_files,
          large_view_item_index: large_view_item_index + new_file_count,
          maybe_has_more_newer_files: file_list.length > 0,
        };
      });

      this.loadFileData(true);
      return file_list.length;
    }

    componentDidUpdate = (prevProps) => {
      const {
        user,
        match,
        app,
        history
      } = this.props;
      const {
        files,
        large_view_item_index,
        mode
      } = this.state;
      // eslint-disable-next-line prefer-const
      let { album_ident, yyyymmdd } = match.params;

      if (mode === this.PAGE_MODE_FREE_ACCOUNT_NO_ALBUMS) {
        return;
      }

      if (match.path === '/view' || match.path === '/view/') {
        const a = app.getAlbum(user.getDefaultAlbumIdent());
        history.push(`/view/${a.getAlbumIdentifier()}`);
        return;
      }

      if (match.path.startsWith('/zoom/')) {
        if (!files || files.length === 0) {
          history.push(`/view/${album_ident}`);
          return;
        }

        if (prevProps.match.path.startsWith('/view')
          || prevProps.match.params.file_ident !== match.params.file_ident
        ) {
          this.handleStartLargeView(files[large_view_item_index]);
        }
      } else if (match.path.startsWith('/view')
        && prevProps.match.path.startsWith('/zoom/')
        && files && files.length > 0
      ) {
        this.handleLargeViewContract();
      } else if (prevProps.user !== user
          || prevProps.match.params.album_ident !== album_ident
          || this.force_update_album
          /* || prevProps.match.params.yyyymmdd != yyyymmdd */) {
        this.force_update_album = false;

        const album = app.getAlbum(album_ident);
        if (album == null) {
          return;
        }

        const foreign = album.getOwnerEmail() !== '';
        const accepted = album.getAccepted();
        const { mode } = this.state;

        if (foreign && !accepted && mode !== this.PAGE_MODE_ACCEPT_SHARED_ALBUM) {
          // eslint-disable-next-line react/no-did-update-set-state
          this.setState({ mode: this.PAGE_MODE_ACCEPT_SHARED_ALBUM });
        }

        if (album && !yyyymmdd) {
          yyyymmdd = album.getMaxDate();
        }

        // eslint-disable-next-line react/no-did-update-set-state
        this.setState({ files: [], loaded: null, album });
        /* await */ this.loadAlbumFiles(album, yyyymmdd);
      }

      if (this.scroll_into_view_id != null) {
        const el = document.getElementById(this.scroll_into_view_id);
        if (el) {
          // little hack: if it's a file, align to center, otherwise (it's a date)
          // align to top
          if (this.scroll_into_view_id.startsWith('fle')) {
            el.scrollIntoView({ block: 'center' });
          } else {
            el.scrollIntoView(true);
          }
          this.scroll_into_view_id = null;
        }
      } else if (this.saved_scroll_position != null) {
        const { scroll_top, scroll_height, num_files } = this.saved_scroll_position;

        if (this.state.files.length > num_files) {
          const new_height = this.main_div_ref.scrollHeight;
          const new_top = scroll_top + (new_height - scroll_height);
          this.main_div_ref.scrollTop = new_top;
          this.saved_scroll_position = null;
        }

        this.observe_files = true;
      }
    }

    componentDidMount() {
      if (this.props.user.getAuth()) {
        const { user, match, app } = this.props;

        let { album_ident, yyyymmdd } = match.params;

        if (!album_ident) {
          album_ident = user.getDefaultAlbumIdent();
        }

        const album = app.getAlbum(album_ident);

        if (album == null) {
          this.setState({ mode: this.PAGE_MODE_FREE_ACCOUNT_NO_ALBUMS });
          return;
        }

        const foreign = album.getOwnerEmail() !== '';
        const accepted = album.getAccepted();
        const { mode } = this.state;

        if (foreign && !accepted && mode !== this.PAGE_MODE_ACCEPT_SHARED_ALBUM) {
          this.setState({ mode: this.PAGE_MODE_ACCEPT_SHARED_ALBUM });
        }

        if (album && !yyyymmdd) {
          yyyymmdd = album.getMaxDate();
        }
        /* await */ this.loadAlbumFiles(album, yyyymmdd);
        /* await */ this.setState({ album });
      }
    }

    componentWillUnmount() {
      this.observer.disconnect();
    }

    imageThumbRefCallback = (ref, f) => {
      if (ref) {
        // eslint-disable-next-line no-param-reassign
        f.ref = ref;
        this.observer.observe(ref);
      }
    }

    dateRefCallback = (ref) => {
      if (ref) {
        if (this.scroll_into_view_id === ref.id) {
          ref.scrollIntoView(true);
          this.scroll_into_view_id = null;
        }
      }
    }

    renderThumbsForDate = (date, index) => {
      const {
        files,
        edit_item,
        move_items,
        selected_items,
        album,
        thumb_size
      } = this.state;

      const render_list = [];
      let render_image_batch = [];
      // eslint-disable-next-line prefer-const
      let file_list_for_date = [];

      // in case of multiple items, there are no limitations on where we can put them
      let source_index;
      if (move_items.length === 1) {
        source_index = files.indexOf(move_items[0]);
      }

      // eslint-disable-next-line no-param-reassign
      for (; index < files.length && isSameDay(files[index].getDate(), date); index += 1) {
        let left_pad; let right_pad;

        const item = files[index];
        file_list_for_date.push(item);

        const prev_item = index > 0 ? files[index - 1] : null;
        const next_item = index < (files.length - 1) ? files[index + 1] : null;

        // eslint-disable-next-line default-case
        switch (files[index].getFileType()) {
          case STOCK_FILE_TYPE_IMAGE:
          case STOCK_FILE_TYPE_VIDEO:
            if (move_items.length === 1 && move_items[0] !== item) {
              const this_item_time = item.getDate().getTime();

              left_pad = ((index !== source_index + 1)
                // eslint-disable-next-line no-mixed-operators
                || (index > 0) && (prev_item.getDate().getTime() !== this_item_time));
              right_pad = (index === files.length - 1)
                  || (next_item.getFileType() !== STOCK_FILE_TYPE_IMAGE
                      && next_item.getFileType() !== STOCK_FILE_TYPE_VIDEO)
                  || next_item.getDate().getTime() !== this_item_time;
            } else if (move_items.length > 1) {
              if (move_items.includes(item)) {
                left_pad = false;
                right_pad = false;
              } else {
                const this_item_time = item.getDate().getTime();
                left_pad = true;
                right_pad = (index === files.length - 1)
                    || (next_item.getFileType() !== STOCK_FILE_TYPE_IMAGE
                        && next_item.getFileType() !== STOCK_FILE_TYPE_VIDEO)
                    || next_item.getDate().getTime() !== this_item_time;
              }
            }

            render_image_batch.push(<ImageThumbItem
              album={album}
              key={files[index].getFileIdentifier()}
              selected={selected_items.includes(files[index])}
              item={files[index]}
              page={this}
              downloading={this.isFileDownloaded(item)}
              playing={this.isFilePlayed(item)}
              moving={move_items.includes(item)}
              left_pad={left_pad}
              right_pad={right_pad}
              thumb_size={thumb_size}
            />);
            break;
          case STOCK_FILE_TYPE_TEXT:
            if (render_image_batch.length > 0) {
              render_list.push(
                <div className="view-album-photo-block-wrapper">
                  <div className={`view-album-photo-block-${thumb_size}`}>
                    {render_image_batch}
                  </div>
                </div>
              );
              render_image_batch = [];
            }
            render_list.push(
              <TextItem
                item={item}
                page={this}
                edit={edit_item === item}
                selected={selected_items.includes(files[index])}
                onEdit={item => this.setState({ edit_item: item })}
                onCancelEdit={this.handleCancelEditText}
              />
            );
            break;
        }
      }

      if (render_image_batch.length > 0) {
        render_list.push(
          <div className="view-album-photo-block-wrapper">
            <div className={`view-album-photo-block-${thumb_size}`}>
              {render_image_batch}
            </div>
          </div>
        );
      }

      return [render_list, index, file_list_for_date];
    }

    renderAllThumbs() {
      const { files, selected_items } = this.state;
      const render_list = [];

      let next_image_index = 0;
      let render_el_list = null;
      let file_list_for_date = null;

      while (next_image_index < files.length) {
        const d = files[next_image_index].getDate();
        [
          render_el_list,
          next_image_index,
          file_list_for_date
        ] = this.renderThumbsForDate(d, next_image_index);
        const date_selected = (
          file_list_for_date.length > 0
          && file_list_for_date.filter(f => !selected_items.includes(f)).length === 0);

        const file_list_for_date_copy = file_list_for_date.slice();

        render_list.push(
          <DateHeader
            reference={this.dateRefCallback}
            d={d}
            selected={date_selected}
            handleSelectedClick={
              () => this.handleDateSelectedClick(d, file_list_for_date_copy, date_selected)
            }
          />
        );
        render_list.push(...render_el_list);
      }

      return render_list;
    }

    renderSelectionMenu() {
      const { selected_items, dialog } = this.state;

      if (dialog === this.PAGE_DIALOG_NONE) {
        return (
          <>
            <div className="view-album-selection-menu">
              <c.MenuButton
                key={2}
                data-testid="thumb-menu-move-image"
                icon={<icon.FourArrows width="2rem" height="2rem" />}
                onClick={() => {
                  this.setState({ mode: this.PAGE_MODE_DEFAULT });
                  this.handleStartMovingThumbs(selected_items);
                }}
                title="Move Items"
              />
              <c.MenuButton
                key={5}
                icon={<icon.WasteBin width="2rem" height="2rem" />}
                title={`Delete ${selected_items.length} Selected Items`}
                onClick={() => this.setState(
                  { dialog: this.PAGE_DIALOG_CONFIRM_DELETE_SELECTION }
                )}
              />
              <c.MenuButton
                key={6}
                icon={<icon.ArrowCounterClockwise width="2rem" height="2rem" />}
                title="Cancel Selection"
                onClick={() => {
                  this.setState({ selected_items: [] });
                  this.setFocusItem(null);
                }}
              />
            </div>
          </>
        );
      } else if (dialog === this.PAGE_DIALOG_CONFIRM_DELETE_SELECTION) {
        return (
          <>
            <div className="view-album-selection-dialog">
              <div>
                <div className="view-album-selection-dialog-title">
                  DELETE {selected_items.length} SELECTED ITEMS?
                </div>
                <div className="view-album-selection-dialog-text">
                  THIS CANNOT BE UNDONE
                </div>
                <div className="view-album-selection-dialog-buttons">
                  <c.DangerButtonSm
                    title="DELETE"
                    onClick={() => {
                      this.setState({ dialog: this.PAGE_DIALOG_NONE });
                      this.handleDeleteSelectedItems();
                    }}
                  />
                  <c.WhiteButtonSm
                    title="CANCEL"
                    onClick={() => {
                      this.setState({ dialog: this.PAGE_DIALOG_NONE });
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        );
      }
      return <></>;
    }

    renderLargeViewMenu(item) {
      const {
        large_view_menu_mode,
        album,
        large_view_item_direct_link,
      } = this.state;

      if (large_view_menu_mode === this.LARGE_VIEW_MENU_SHOW) {
        const file_name = item.getName();
        const video_index_info = item.getIndexInfo(MEDIA_TYPE_VIDEO);
        const file_date = formatDate(item.getDate());
        const album_name = album.getAlbumName();
        const file_size = formatSize(
          video_index_info ? video_index_info.bucket_size : item.getBucketSize()
        );

        return (
          <>
            <div className="view-large-menu">
              <c.MenuButton
                className="view-large-menu-hide-button"
                title="Hide Menu"
                icon={<icon.IconChevron width="2rem" height="2rem" />}
                onClick={() =>
                  // eslint-disable-next-line implicit-arrow-linebreak
                  this.setState({ large_view_menu_mode: this.LARGE_VIEW_MENU_HIDDEN })
                }
              />
              <div>
                <div className="view-large-menu-text-1">{album_name}</div>
                <div className="view-large-menu-text-2">{file_date}</div>
              </div>
              <div>
                <div className="view-large-menu-text-1">{file_name}</div>
                <div className="view-large-menu-text-2">{file_size}</div>
              </div>

              <c.MenuButton
                key={1}
                icon={<icon.ChainLinks width="2rem" height="2rem" />}
                onClick={async () => {
                  this.setState({ large_view_menu_mode: this.LARGE_VIEW_DIALOG_DIRECT_LINK });
                  const url = await this.createDirectLink(item);
                  this.setState({ large_view_item_direct_link: url });
                }}
                title="Direct Link"
              />
              <c.MenuButton
                key={5}
                icon={<icon.BaloonText width="2rem" height="2rem" />}
                onClick={() => this.setState({
                  large_view_menu_mode: this.LARGE_VIEW_EDIT_IMAGE_COMMENT
                })}
                title="Image Comment"
              />
              <c.MenuButton
                key={6}
                icon={<icon.WasteBin width="2rem" height="2rem" />}
                onClick={() => this.setState({
                  large_view_menu_mode: this.LARGE_VIEW_DIALOG_CONFIRM_DELETE
                })}
                title="Delete Item"
              />
            </div>
          </>
        );
      } else if (large_view_menu_mode === this.LARGE_VIEW_MENU_HIDDEN) {
        return (
          <div
            className="view-large-menu-collapsed"
            onClick={() => this.setState(
              { large_view_menu_mode: this.LARGE_VIEW_MENU_SHOW }
            )}
            onMouseEnter={() => this.setState(
              { large_view_menu_mode: this.LARGE_VIEW_MENU_SHOW }
            )}
          />
        );
      } else if (large_view_menu_mode === this.LARGE_VIEW_DIALOG_DIRECT_LINK) {
        return (
          <DirectLinkDialog
            global
            direct_link={large_view_item_direct_link}
            onClose={() => this.setState({ large_view_menu_mode: this.LARGE_VIEW_MENU_HIDDEN })}
          />
        );
      } else if (large_view_menu_mode === this.LARGE_VIEW_DIALOG_CONFIRM_DELETE) {
        return (
          <ConfirmDeleteDialog
            global
            onDelete={async () => {
              const new_files = await this.handleDeleteFile(item);

              if (new_files.length > 0) {
                let { large_view_item_index } = this.state;

                if (large_view_item_index >= new_files.length) {
                  large_view_item_index = new_files.length - 1;
                  await this.setStatePromise({ large_view_item_index });
                }

                const new_item = new_files[large_view_item_index];
                const large_view_main_image_avail = new_item.getImageDataURL() != null;
                this.setState({ large_view_main_image_avail });

                if (!large_view_main_image_avail) {
                  /* await */ this.loadAndDecryptMainImage(album, new_item, false);
                }

                this.setState({ large_view_menu_mode: this.LARGE_VIEW_MENU_HIDDEN });
              } else {
                await this.setStateAsync({
                  mode: this.PAGE_MODE_DEFAULT,
                  large_view_item_index: -1,
                });
              }
            }}
            onClose={() => this.setState({ large_view_menu_mode: this.LARGE_VIEW_MENU_HIDDEN })}
          />
        );
      }

      return <></>;
    }

    renderLargeView() {
      const {
        files,
        large_view_item_index,
        large_view_menu_mode,
        large_view_video_show_wait_message,
        large_view_show_nav_buttons,
      } = this.state;

      if (files.length === 0) {
        return <></>;
      }

      const item = files[large_view_item_index];
      const is_video = item.getFileType() === STOCK_FILE_TYPE_VIDEO;
      const video_stream_url = item.getVideoStreamURL();

      const img_src = item.getImageDataURL() ? item.getImageDataURL() : item.getThumbDataURL();

      // dim the comment when the menu is visible
      const comment_style = (
        large_view_menu_mode === this.LARGE_VIEW_MENU_SHOW
          ? { color: '#888', }
          : { cursor: 'pointer' }
      );

      return (
        <div
          className="view-large-main"
          onMouseMove={
            platform.isHoverAvailable() && this.handleLargeViewMouseActivity || undefined}
          onClick={platform.isHoverAvailable() && this.handleLargeViewMouseActivity || undefined}
          onContextMenu={
            platform.isHoverAvailable() && this.handleLargeViewMouseActivity || undefined}
        >
          {large_view_show_nav_buttons && (
            <div
              className="view-large-left-arrow"
            >
              <c.MenuButton
                onClick={() => this.handleLargeViewNavClick(true)}
                title="Later"
                icon={<icon.SquareLeftArrow width="2rem" height="2rem" />}
              />
            </div>
          )}
          { large_view_show_nav_buttons && (
            <div className="view-large-right-arrow">
              <c.MenuButton
                title="Earlier"
                onClick={() => this.handleLargeViewNavClick(false)}
                icon={<icon.SquareRightArrow width="2rem" height="2rem" />}
              />
            </div>
          )}
          <div className="view-large-image-container">
            {!is_video && item.getImageDataURL() == null && (
              <div className="view-large-image-loading">
                Loading Hi-Res...
              </div>
            )}
            {!is_video && (
              <img
                // eslint-disable-next-line prefer-destructuring
                onTouchStart={(ev) => { this.touch_start_ev = ev.touches[0]; }}
                onTouchMove={(ev) => { this.touch_move_ev = ev.touches[0]; }}
                onTouchEnd={ev => this.handleTouchEnd(ev)}
                src={img_src}
                className="view-large-image"
              />
            )}
            {is_video && (
              <video
                // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video#attr-preload
                preload="none"
                onTouchStart={(ev) => { this.touch_start_ev = ev.touches[0]; }}
                onTouchMove={(ev) => { this.touch_move_ev = ev.touches[0]; }}
                onTouchEnd={ev => this.handleTouchEnd(ev)}
                onPlay={() => this.setState({ large_view_video_show_wait_message: false })}
                src={video_stream_url}
                controls
                // doesn't work
                controlsList="nodownload"
                // suppress menu to disable "save as" which doesn't work
                onContextMenu={ev => ev.preventDefault()}
                autoPlay
                className="view-large-image"
              />
            )}

            {is_video && large_view_video_show_wait_message && (
              <div
                className="view-large-image"
                style={{
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  position: 'absolute',
                  top: 'calc(50% - 2rem)',
                }}
              >
                Loading video can take time. Please wait...
              </div>
            )}
            {large_view_menu_mode === this.LARGE_VIEW_EDIT_IMAGE_COMMENT && (
              <c.LargeViewEditComment
                onSave={async (text) => {
                  await this.handleSaveImageComment(item, text);
                  this.setState({ large_view_menu_mode: this.LARGE_VIEW_MENU_HIDDEN });
                }}
                onCancel={
                  () => this.setState({ large_view_menu_mode: this.LARGE_VIEW_MENU_HIDDEN })
                }
                value={item.getComment()}
              />
            )}
            {large_view_menu_mode !== this.LARGE_VIEW_EDIT_IMAGE_COMMENT && (
              <div
                style={comment_style}
                onClick={
                  () => this.setState({ large_view_menu_mode: this.LARGE_VIEW_EDIT_IMAGE_COMMENT })
                }
                className="view-large-image-comment"
              >
                {item.getComment()}
              </div>
            )}
          </div>
          {this.renderLargeViewMenu(item)}
        </div>
      );
    }

    renderAcceptAlbumView() {
      const {
        album,
      } = this.state;

      const email = album.getOwnerEmail();
      const name = album.getAlbumName();

      return (
        <div className="view-accept-album-main">
          <div style={{ margin: '1rem 0' }}>
            User <b>{email}</b> wants to share their album <b>{name}</b> with you.
          </div>
          <div>Would you like to accept and start viewing the album?</div>
          {album.getCanAddFiles() && (
            <div style={{ margin: '1rem 0' }}>
              You will be able to add photos and videos to the album
            </div>
          )}
          <c.WhiteButton
            title="ACCEPT"
            onClick={() => this.handleRespondSharedAlbum(
              album, this.ALBUM_SHARE_RESPONSE_ACCEPT
            )}
          />
          <c.DangerButton
            style={{ marginTop: '1rem' }}
            title="REJECT & BLOCK USER"
            onClick={() => this.handleRespondSharedAlbum(
              album, this.ALBUM_SHARE_RESPONSE_BLOCK
            )}
          />
        </div>
      );
    }


    render() {
      const {
        user,
        history,
        app,
        albums
      } = this.props;

      const {
        files,
        album,
        selected_items,
        mode,
        cal_year,
        cal_month,
        cal_day,
        active_days,
        thumb_size,
      } = this.state;

      const show_side_menu = app.getShowSideMenu();
      // const main_panel_class =
      //    show_side_menu ? "main-panel-with-menu" : "main-panel-centered";
      const main_panel_class = 'main-panel-centered';

      if (mode !== this.PAGE_MODE_FREE_ACCOUNT_NO_ALBUMS && (!album || files === null)) {
        return <LoadingScreen />;
      }

      let tools;
      if (mode === this.PAGE_MODE_LARGE_VIEW) {
        tools = (
          <c.MenuButton
            title="Back"
            onClick={history.goBack}
            icon={<icon.Grid3x2Gap width="1.75rem" height="1.75rem" />}
          />
        );
      }

      const can_upload = album != null && (album.getOwnerEmail() === '' || album.getCanAddFiles());

      return (
        <>
          {this.renderAlert()}
          <div ref={(ref) => { this.main_div_ref = ref; }} className="main">
            <TopBar
              {...{
                user,
                app,
                album,
                tools
              }}
              settings
              upload={can_upload}
              handleZoomIn={
                (album != null && thumb_size === this.THUMB_SIZE_11)
                  ? this.handleZoomIn
                  : undefined
              }
              handleZoomOut={
                (album != null
                  && platform.getRootWidth() >= 768
                  && thumb_size === this.THUMB_SIZE_22
                )
                  ? this.handleZoomOut
                  : undefined}
            />
            {show_side_menu && (
              <SideMenu
                {...{
                  user,
                  app,
                  albums,
                  cal_year,
                  cal_month,
                  cal_day,
                  active_days
                }}
                onClose={() => app.setShowSideMenu(false)}
                onCalendarClick={this.handleCalendarClick}
                active={album != null && album.getAlbumIdentifier()}
              />
            )}

            {mode === this.PAGE_MODE_ACCEPT_SHARED_ALBUM && this.renderAcceptAlbumView()}

            {mode === this.PAGE_MODE_LARGE_VIEW && this.renderLargeView()}

            {mode === this.PAGE_MODE_DEFAULT && files.length === 0 && (
              <div className={main_panel_class}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '90vh',
                  fontSize: '1.25rem',
                }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      No items to display
                    </div>
                    <c.WhiteButton
                      style={{ marginTop: '2rem' }}
                      onClick={() => history.push(`/upload/${album.getAlbumIdentifier()}`)}
                      title="UPLOAD"
                    />
                  </div>
                </div>
              </div>
            )}
            {(mode === this.PAGE_MODE_DEFAULT || mode === this.PAGE_MODE_ERROR_NO_SERVICE_WORKER)
            && files.length > 0 && (
              <div className={main_panel_class}>
                <div>
                  <div className="view-album-title">
                    {/* album.getAlbumName() */}
                  </div>
                  {this.renderAllThumbs()}
                  {selected_items.length > 0 && this.renderSelectionMenu()}
                </div>
              </div>
            )}
            { mode === this.PAGE_MODE_ERROR_NO_SERVICE_WORKER && (
              <c.FullScreenAlert>
                <div className="full-screen-alert-message">
                  Unable to play video at this time: service worker is not available.
                  <br />Please wait a minute, reload the page and retry.
                </div>
                <c.WhiteButton
                  onClick={() => this.handleLargeViewContract()}
                  title="BACK TO ALBUM"
                />
              </c.FullScreenAlert>
            )}
            { mode === this.PAGE_MODE_FREE_ACCOUNT_NO_ALBUMS && (
              <div className={main_panel_class}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '90vh',
                  fontSize: '1.25rem',
                }}
                >
                  <div>
                    <div style={{ textAlign: 'center' }}>
                      No items to display. Albums shared
                      with you will be presented here
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      );
    }
}
