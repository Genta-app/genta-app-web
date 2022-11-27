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
/* eslint-disable no-bitwise */
/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-shadow */
/* eslint-disable react/sort-comp */
/* eslint-disable no-else-return */
/* eslint-disable react/jsx-one-expression-per-line */

import React from 'react';

import { withRouter } from 'react-router';

import EXIF from 'exif-js';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';

import * as m from '../components/Menu';

import * as crypto from '../library/Crypto';
import * as file from '../library/File';

import * as platform from '../library/Platform';

import { canvasToBlob } from '../library/Utils';

import {
  formatSize,
  formatDate,
  daysInMonth,
  formatHumanFriendlyDate,
  parseYMD,
} from '../library/Format';

import * as api from '../library/Api';

import { unpackValue } from '../library/Pack';
import { MP4FileReader } from '../library/MP4';

const FILE_STATUS_QUEUED = 1;
const FILE_STATUS_UPLOADING = 2;
const FILE_STATUS_SUCCESS = 3;
const FILE_STATUS_ERROR = 4;

const filename_date_re = /([0-9]{8})_[0-9]{6}\.[0-9a-zA-Z]+/;

async function renderElementToBuffer(el, width, height) {
  const canvas = document.createElement('canvas');
  canvas.style = 'display: none';
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(el, 0, 0, width, height);

  return canvasToBlob(canvas);
}

function getAlbumNameWithOwner(a) {
  return (a.getOwnerEmail() === ''
    ? a.getAlbumName()
    : `${a.getAlbumName()} (by ${a.getOwnerEmail()})`
  );
}

function isAlbumInSystemBucket(album, buckets) {
  const bi = album.getBucketIdentifier();
  const found_buckets = buckets.filter(b => b.getBucketIdentifier() === bi);
  return found_buckets.length > 0 ? found_buckets[0].isSystemBucket() : false;
}

function UploadingMessage({
  total_files,
  uploaded_files,
  not_enough_space,
  network_error,
  style
}) {
  const insufficient_space_div = (not_enough_space
    ? (
      <>
        <div style={{ color: '#FC55FF', fontWeight: 'bold', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            SOME UPLOADS FAILED <br />BECAUSE OF INSUFFICIENT SPACE
          </div>
        </div>
      </>
    )
    : <></>);

  if (network_error) {
    return (
      <div style={style}>
        <div style={{ color: '#FC55FF', fontWeight: 'bold', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            NETWORK ERROR <br />PLEASE CHECK YOUR CONNECTION
          </div>
        </div>
      </div>
    );
  } else if (total_files > uploaded_files) {
    return (
      <div style={style}>
        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '2rem' }}>
          <div style={{ textAlign: 'center' }}>UPLOADING...</div>
          <div>&nbsp;</div>
          <div style={{ textAlign: 'center' }}>
            {`COMPLETED ${uploaded_files} OF ${total_files}`}
          </div>
          <div>&nbsp;</div>
        </div>
        {insufficient_space_div}
      </div>
    );
  } else if (total_files > 0) {
    return (
      <div style={style}>
        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '2rem' }}>
          <div>&nbsp;</div>
          <div style={{ textAlign: 'center' }}>{`UPLOADED ${uploaded_files} FILE(s)`}</div>
          <div>&nbsp;</div>
        </div>
        {insufficient_space_div}
      </div>
    );
  } else {
    return <></>;
  }
}

export class UploadPageComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // dropdowns
      calendar_open: false,
      albumlist_open: false,
      filelist_open: false,

      drag_active: false,

      selected_album_ident: null,
      upload_date: new Date(),
      stats_files: [],

      not_enough_space: false,
      network_error: false,

      autodetect_file_date: true,
    };

    this.file_input_ref = null;
    this.upload_queue = [];
    this.processing = 0;
    this.relative_ordering_offset = 0;
  }

  initSelectedAlbum() {
    const { user, match } = this.props;

    let { album_ident } = match.params;
    if (!album_ident) {
      album_ident = user.getDefaultAlbumIdent();
    }

    this.setState({ selected_album_ident: album_ident });
  }

  setDragActive = drag_active => this.setState({ drag_active });

  getUploadableAlbumList = albums => albums.filter(
    a => a.getOwnerEmail() === '' || a.getCanAddFiles()
  );

  getSelectedAlbum = () => {
    const { albums } = this.props;
    const { selected_album_ident } = this.state;
    const filtered_list = albums.filter(a => a.getAlbumIdentifier() === selected_album_ident);
    if (filtered_list.length > 0) {
      return filtered_list[0];
    }
    return null;
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

  setFileState = (file_data, state) => {
    const { stats_files } = this.state;
    const {
      album,
      file,
      upload_year,
      upload_month,
      upload_day
    } = file_data;

    let found = false;

    for (const f of stats_files) {
      if (f.album !== album || f.file !== file || f.upload_year !== upload_year
        || f.upload_month !== upload_month || f.upload_day !== upload_day) {
        continue;
      }

      f.state = state;
      this.setState({ stats_files: stats_files.map(x => x) });
      found = true;
      break;
    }

    if (!found) {
      file_data.state = state;
      stats_files.push(file_data);
      this.setState({ stats_files: stats_files.map(x => x) });
    }
  }

  updateFileUploadedBytes = (stock_file, total_uploaded_bytes) => {
    const { stats_files } = this.state;

    for (const f of stats_files) {
      if (f.file === stock_file) {
        f.uploaded_bytes = total_uploaded_bytes;
        break;
      }
    }

    this.setState({ stats_files: stats_files.map(x => x) });
  }

  async processVideoUpload(file_data) {
    const { buckets } = this.props;

    const file_type = file.STOCK_FILE_TYPE_VIDEO;
    const media_type = file.MEDIA_TYPE_VIDEO;
    // eslint-disable-next-line no-unused-vars
    const readFile = file.readFile;
    const uploadImageFile = file.uploadImageFile;
    const uploadLargeFile = file.uploadLargeFile;

    const { app, user } = this.props;
    const { album, upload_date, ordering } = file_data;
    const file_obj = file_data.file;

    const system_space_promise = (
      isAlbumInSystemBucket(album, buckets) ? api.apiSystemSpace() : null
    );

    const encrypted = album.getEncrypted();

    this.setFileState(file_data, FILE_STATUS_UPLOADING);

    let file_date = upload_date;

    if (file_date == null) {
      try {
        const base_date = new Date('1904-01-01');
        const r = new MP4FileReader();
        const root_buffer_list = await r.loadFromFile(file_obj);

        for (const root_b of root_buffer_list) {
          const root_box = new Uint8Array(root_b);
          if (root_box[4] === 109
            && root_box[5] === 111
            && root_box[6] === 111
            && root_box[7] === 118
          ) { // moov
            const moov_buffer_list = await r.loadFromMemory(root_box.slice(8));
            for (const moov_b of moov_buffer_list) {
              const moov_box = new Uint8Array(moov_b);
              if (moov_box[4] === 109
                && moov_box[5] === 118
                && moov_box[6] === 104
                && moov_box[7] === 100
              ) { // mvhd
                const full_box_version = moov_box[8];
                const seconds = (moov_box[12] * 256 * 256 * 256
                  + moov_box[13] * 256 * 256
                  + moov_box[14] * 256 + moov_box[15]);
                if (full_box_version === 0) {
                  // if seconds === 0, assume the date was not set and try a different way below
                  if (seconds === 0) {
                    file_date = null;
                  } else {
                    file_date = new Date(base_date.getTime() + seconds * 1000);
                  }
                } else {
                  // TODO: version 1, 64 bit date
                  // (aka mp4 plans to exist way longer than it deserves)
                }
              }
            }
          }
        }
        file_data.upload_date = file_date;
      } catch (e) {
        console.error(e);
      }
    }

    if (file_date === null) {
      try {
        const m = file_obj.name.match(filename_date_re);
        if (m !== null && m.length === 2) {
          file_date = parseYMD(Number(m[1]));
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (file_date === null) {
      file_date = new Date();
    }


    const video = document.createElement('video');
    video.crossorigin = 'anonymous';
    video.style = 'width: 1px; height: 1px; opacity: 0.00001; position: fixed; top: 0; left: 0';

    // need to insert the video to the dom, otherwise it's not rendered
    const root = document.getElementById('root');
    document.body.insertBefore(video, root);

    await new Promise((resolve) => {
      video.onloadeddata = resolve;
      video.src = URL.createObjectURL(file_obj);
    });

    // also need to wait (or maybe need to wait for some state)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const large_w = video.videoWidth;
    const large_h = video.videoHeight;

    let small_w; let small_h; let orientation = 0;

    if (large_w <= large_h) {
      small_w = 400;
      small_h = (large_h * 400 / large_w) | 0;
    } else {
      small_h = 400;
      small_w = large_w * 400 / large_h;
      orientation = 1;
    }

    const image_buffer = await renderElementToBuffer(video, large_w, large_h);
    const thumb_buffer = await renderElementToBuffer(video, small_w, small_h);

    const file_key = encrypted ? crypto.symmetricGenerateKey() : null;

    if (system_space_promise != null) {
      const system_space_avail = Number(
        unpackValue((await system_space_promise).response).available_system_storage_bytes
      );

      if (system_space_avail < (image_buffer.length + thumb_buffer.length + file_data.file.size)) {
        this.setState({ not_enough_space: true });
        this.setFileState(file_data, FILE_STATUS_ERROR);
        return;
      }
    }

    try {
      const { file_identifier, status } = await uploadImageFile(
        app, user, album,
        encrypted ? file_obj.name : (file_obj.name + '.jpg'),
        file_type, file_key, image_buffer, thumb_buffer,
        file_date, orientation, media_type, encrypted, ordering
      );

      if (file_identifier == null) {
        if (status === 413) {
          this.setState({ not_enough_space: true });
        }
        this.setFileState(file_data, FILE_STATUS_ERROR);
        return;
      }

      const large_success = await uploadLargeFile(
        app, user, album, file_key, file_identifier, file_obj,
        this.updateFileUploadedBytes, encrypted
      );

      if (large_success) {
        this.setFileState(file_data, FILE_STATUS_SUCCESS);
      } else {
        this.setFileState(file_data, FILE_STATUS_ERROR);
      }
    } catch (e) {
      console.error(e);
      this.setFileState(file_data, FILE_STATUS_ERROR);
    } finally {
      video.remove(); // from the dom
    }
  }

  async processImageUpload(file_data) {
    // "file" is the module
    const file_type = file.STOCK_FILE_TYPE_IMAGE;
    const media_type = file.MEDIA_TYPE_IMAGE;
    const readFile = file.readFile;
    const uploadImageFile = file.uploadImageFile;

    const { app, user, buckets } = this.props;
    const { album, upload_date, ordering } = file_data;
    const file_obj = file_data.file;

    const system_space_promise = (
      isAlbumInSystemBucket(album, buckets) ? api.apiSystemSpace() : null
    );

    const encrypted = album.getEncrypted();

    this.setFileState(file_data, FILE_STATUS_UPLOADING);

    const img = document.createElement('img');

    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = URL.createObjectURL(file_obj);
    });

    let w; let h; let orientation = 0;

    const imsize = 550;

    if (img.width <= img.height) {
      w = Math.min(imsize, img.width);
      h = img.height * w / img.width;
    } else {
      h = Math.min(imsize, img.height);
      w = img.width * h / img.height;
      orientation = 1;
    }

    const thumb_buffer = await renderElementToBuffer(img, w, h);
    const image_array_buffer = await readFile(file_obj, 0, file_obj.size);
    const image_buffer = new Uint8Array(image_array_buffer);

    let file_date = upload_date;

    if (file_date === null) {
      try {
        const exif_data = EXIF.readFromBinaryFile(image_array_buffer);
        const d = exif_data.DateTime.split(' ')[0].split(':');
        // eslint-disable-next-line no-new-wrappers
        file_date = new Date(d[0], (new Number(d[1])) - 1, d[2]);
        file_data.upload_date = file_date;
      } catch (e) {
        console.error(e);
      }
    }

    if (file_date === null) {
      try {
        const m = file_obj.name.match(filename_date_re);
        if (m !== null && m.length === 2) {
          file_date = parseYMD(Number(m[1]));
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (file_date === null) {
      file_date = new Date();
    }

    const file_key = encrypted ? crypto.symmetricGenerateKey() : null;

    if (system_space_promise != null) {
      const system_space_avail = (
        Number(unpackValue((await system_space_promise).response).available_system_storage_bytes)
      );

      if (system_space_avail < (image_buffer.length + thumb_buffer.length)) {
        this.setState({ not_enough_space: true });
        this.setFileState(file_data, FILE_STATUS_ERROR);
        return;
      }
    }

    try {
      const { file_identifier, status } = await uploadImageFile(
        app, user, album, file_obj.name, file_type, file_key, image_buffer,
        thumb_buffer, file_date, orientation, media_type, encrypted, ordering
      );

      if (file_identifier != null) {
        this.setFileState(file_data, FILE_STATUS_SUCCESS);
      } else {
        this.setFileState(file_data, FILE_STATUS_ERROR);
        if (status === 413) {
          this.setState({ not_enough_space: true });
        }
      }
    } catch (e) {
      console.error(e);
      this.setFileState(file_data, FILE_STATUS_ERROR);
    }
  }

  processUploadQueue = async () => {
    this.processing += 1;

    // const { app } = this.props;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const file_data = this.upload_queue.pop();

      if (file_data === undefined) {
        break;
      }

      const media_type = file.getMediaTypeForFile(file_data.file);

      if (media_type === file.MEDIA_TYPE_IMAGE) {
        await this.processImageUpload(file_data);
      } else if (media_type === file.MEDIA_TYPE_VIDEO) {
        await this.processVideoUpload(file_data);
      }
    }

    this.processing -= 1;

    if (this.processing === 0) {
      const { app, user } = this.props;
      app.loadAlbumList(user);
    }
  }

  dropHandler = async (ev) => {
    ev.preventDefault();

    this.setState({ network_error: false });

    const { albums } = this.props;
    const {
      selected_album_ident,
      upload_date,
      autodetect_file_date,
    } = this.state;

    let { stats_files } = this.state;

    if (stats_files.filter(f => f.state !== FILE_STATUS_SUCCESS).length === 0) {
      stats_files = [];
      // this is a hack, since we are supposed to modify react state only via setState()
      // however we need this change to be visible in subsequent calls to setFileState()
      // and we cannot use await since that will lead to releasing file object references
      // and they may become invalid in the code below await
      // eslint-disable-next-line react/destructuring-assignment
      this.state.stats_files.length = 0; // empty array
    }

    const album = this.getUploadableAlbumList(albums).find(
      a => a.getAlbumIdentifier() === selected_album_ident
    ) || null;

    const ev_data_transfer = ev.dataTransfer;
    const ev_target = ev.target;

    const items_for_queue = [];

    if (ev_data_transfer && ev_data_transfer.items) {
      for (let i = 0; i < ev_data_transfer.items.length; i += 1) {
        if (ev_data_transfer.items[i].kind === 'file') {
          const file = ev_data_transfer.items[i].getAsFile();
          const queue_data = {
            album,
            file,
            upload_date: autodetect_file_date ? null : upload_date,
            uploaded_bytes: 0,
            ordering: 0,
          };

          this.relative_ordering_offset += 1;
          items_for_queue.push(queue_data);
        }
      }
    } else if (ev_data_transfer && ev_data_transfer.files) {
      for (let i = 0; i < ev_data_transfer.files.length; i += 1) {
        const file = ev_data_transfer.files[i];
        const queue_data = {
          album,
          file,
          upload_date: autodetect_file_date ? null : upload_date,
          uploaded_bytes: 0,
          ordering: 0,
        };
        this.relative_ordering_offset += 1;
        items_for_queue.push(queue_data);
      }
    } else {
      for (let i = 0; i < ev_target.files.length; i += 1) {
        const file = ev_target.files[i];
        const queue_data = {
          album,
          file,
          upload_date: autodetect_file_date ? null : upload_date,
          uploaded_bytes: 0,
          ordering: 0,
        };
        this.relative_ordering_offset += 1;
        items_for_queue.push(queue_data);
      }
    }

    if (this.processing === 0) {
      try {
        const ordering_xhr = await api.apiFileOrdering();
        if (ordering_xhr.status === 200) {
          this.relative_ordering_offset = unpackValue(ordering_xhr.response).max_ordering + 1;
        } else {
          this.setState({ network_error: true });
          return;
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    for (const item of items_for_queue) {
      this.upload_queue.push(item);
      this.setFileState(item, FILE_STATUS_UPLOADING);
    }

    for (const file_data of this.upload_queue) {
      if (file_data.ordering === 0) {
        file_data.ordering = this.relative_ordering_offset;
        this.relative_ordering_offset += 1;
      }
    }

    const max_processors = 8;
    const current_processors = this.processing;

    if (this.processing < max_processors && this.upload_queue.length > 0) {
      for (let x = 0; x < (max_processors - current_processors); x += 1) {
        /* await */ this.processUploadQueue();
      }
    }
  }

    handleRetryFailed = () => {
      const { stats_files } = this.state;
      const failed_list = stats_files.filter(f => f.state === FILE_STATUS_ERROR);
      const non_failed_files = stats_files.filter(f => f.state !== FILE_STATUS_ERROR);

      this.setState({ stats_files: non_failed_files });

      for (const f of failed_list) {
        const queue_data = {
          album: f.album,
          file: f.file,
          ordering: f.ordering,
          upload_date: f.upload_date,
          uploaded_bytes: 0,
        };
        this.upload_queue.push(queue_data);
        this.setFileState(queue_data, FILE_STATUS_UPLOADING);
      }

      if (this.processing === 0 && this.upload_queue.length > 0) {
        for (let x = 0; x < 8; x += 1) {
          /* await */ this.processUploadQueue();
        }
      }
    }

  onCalendarClick = (el_type, value) => {
    const {
      upload_date,
      calendar_open,
    } = this.state;

    const upload_year = upload_date.getFullYear();
    const upload_month = upload_date.getMonth();
    const upload_day = upload_date.getDate();

    if (el_type === 'dropdown') {
      this.setState({ calendar_open: !calendar_open });
    } else if (el_type === 'days') {
      this.setState({
        upload_date: new Date(value.year, value.month, value.label),
        calendar_open: false,
      });
    } else if (el_type === 'years') {
      let selected_year;

      if (value === 'chevron-left') {
        selected_year = upload_year - 1;
      } else if (value === 'chevron-right') {
        selected_year = upload_year + 1;
      } else {
        selected_year = value.label;
      }

      const dim = daysInMonth(selected_year, upload_month);
      this.setState({
        upload_date: new Date(
          selected_year,
          upload_month,
          Math.min(upload_day, dim)
        )
      });
    } else if (el_type === 'months') {
      let selected_month;

      if (value === 'chevron-left') {
        selected_month = upload_month === 0 ? 11 : upload_month - 1;
      } else if (value === 'chevron-right') {
        selected_month = upload_month === 11 ? 0 : upload_month + 1;
      } else {
        selected_month = value.month;
      }

      let selected_year = upload_year;
      if (selected_month === 0 && upload_month === 11) {
        selected_year += 1;
      } else if (selected_month === 11 && upload_month === 0) {
        selected_year -= 1;
      }

      const dim = daysInMonth(selected_year, selected_month);

      this.setState({
        upload_date: new Date(
          selected_year,
          selected_month,
          Math.min(upload_day, dim)
        )
      });
    } else if (el_type === 'weekdays') {
      // when clicked on a weekday name, position on the most recent weekday
      // preceeding currently selected day. this is supposed to help position
      // on e.g. "last Sunday"
      const h = 60 * 60 * 1000;
      const d = 24 * h;

      const current_weekday = upload_date.getDay();
      const selected_weekday = value.index;

      const selected_date = new Date();
      if (current_weekday > selected_weekday) {
        selected_date.setTime(upload_date.getTime() - current_weekday * d + selected_weekday * d);
      } else {
        selected_date.setTime(
          upload_date.getTime() - (7 + current_weekday - selected_weekday) * d
        );
        // subtracting times across the daylight saving point will
        // set the time to day before what we need
        if (selected_date.getHours() === 23) {
          selected_date.setTime(selected_date.getTime() + 1 * h);
        }
      }

      this.setState({ upload_date: selected_date, calendar_open: true });
    }
  }

  onAlbumlistClick = (el_type, value) => {
    const { albumlist_open } = this.state;

    if (el_type === 'dropdown') {
      this.setState({ albumlist_open: !albumlist_open });
    } else if (el_type === 'item') {
      this.setState({
        albumlist_open: !albumlist_open,
        selected_album_ident: value.album.getAlbumIdentifier(),
      });
    }
  }

  // eslint-disable-next-line no-unused-vars
  onFilelistClick = (el_type, value) => {
    const { filelist_open } = this.state;

    if (el_type === 'dropdown') {
      this.setState({ filelist_open: !filelist_open });
    }
  }

  render() {
    const {
      user,
      app,
      albums,
      // buckets,
      // history
    } = this.props;

    const {
      calendar_open,
      albumlist_open,
      filelist_open,
      selected_album_ident,
      upload_date,
      stats_files,
      drag_active,
      not_enough_space,
      network_error,
      autodetect_file_date,
    } = this.state;

    const selected_album = this.getSelectedAlbum();
    const selected_album_name = selected_album ? getAlbumNameWithOwner(selected_album) : '';

    const albumlist = this.getUploadableAlbumList(albums).map(a => ({
      label: getAlbumNameWithOwner(a),
      album: a,
    }));

    const upload_year = upload_date.getFullYear();
    const upload_month = upload_date.getMonth();
    const upload_day = upload_date.getDate();

    const { years, months, days } = c.getCalendarRecordForDate(
      upload_year, upload_month, upload_day, {}
    );

    const total_files = stats_files.length;
    const num_uploaded_files = stats_files.filter(f => f.state === FILE_STATUS_SUCCESS).length;
    const num_failed_files = stats_files.filter(f => f.state === FILE_STATUS_ERROR).length;

    let files_label;

    if (total_files === 0) {
      files_label = 'NONE';
    } else {
      // eslint-disable-next-line no-lonely-if
      if (num_failed_files > 0) {
        files_label = (
          <>
            <span>{num_uploaded_files}/{total_files} UPLOADED</span>
            <span className="text-danger">&nbsp;{num_failed_files} ERRORS</span>
          </>
        );
      } else if (total_files === num_uploaded_files) {
        files_label = 'ALL FILES UPLOADED';
      } else {
        files_label = `${num_uploaded_files}/${total_files} UPLOADED`;
      }
    }

    const filelist_custom_items = stats_files.map((f) => {
      let status_div;
      let item_class_name;

      // eslint-disable-next-line default-case
      switch (f.state) {
        case FILE_STATUS_QUEUED:
          status_div = <div />;
          item_class_name = 'upload-filelist-item';
          break;
        case FILE_STATUS_UPLOADING:
          // eslint-disable-next-line no-case-declarations
          let progress = '...';
          if (f.uploaded_bytes > 0) {
            progress = `${Math.min(99, Math.round(f.uploaded_bytes / f.file.size * 100))}%`;
          }

          status_div = <div>{progress}</div>;
          item_class_name = 'upload-filelist-item';
          break;
        case FILE_STATUS_ERROR:
          item_class_name = 'upload-filelist-item upload-filelist-item-error';
          status_div = <icon.IconDashCircle />;
          break;
        case FILE_STATUS_SUCCESS:
          item_class_name = 'upload-filelist-item upload-filelist-item-success';
          status_div = <icon.IconCheck />;
          break;
      }

      return (
        <>
          <div key={f} className={item_class_name}>
            <div key={1} style={{ overflow: 'hidden' }}>
              <div key={2} className="upload-filelist-item-name">
                {f.file.name}
              </div>
              <div key={3} className="upload-filelist-item-details">
                {f.upload_date === null ? '' : formatDate(f.upload_date)}
                &nbsp;&nbsp;&nbsp;&nbsp;
                {formatSize(f.file.size)}
              </div>
            </div>
            <div key={4} className="upload-filelist-item-icon">{status_div}</div>
          </div>
        </>
      );
    });

    const show_side_menu = app.getShowSideMenu();
    // const main_panel_class =
    //     show_side_menu ? 'main-panel-with-menu' : 'main-panel-centered';

    return (
      <>
        <div className="main">
          <m.TopBar
            user={user}
            app={app}
            album={selected_album}
            view={selected_album != null && total_files === (num_uploaded_files + num_failed_files)}
            settings={selected_album != null}
          />
          {show_side_menu && (
            <m.SideMenu
              user={user}
              app={app}
              albums={albums}
              onClose={() => app.setShowSideMenu(false)}
              active={selected_album_ident}
            />
          )}

          <div className="main-panel-centered">
            <div className="main-signup-panel">
              <div className="main-form">
                <div className="form-title">Upload</div>
                {/* TODO: implement and enable progress bar */}
                {/* <c.ProgressBar title="UPLOAD PROGRESS" value={0} /> */}

                <c.DropdownCalendar
                  disabled={autodetect_file_date}
                  open={calendar_open}
                  onClick={this.onCalendarClick}
                  label="UPLOAD FOR"
                  years={years}
                  months={months}
                  days={days}
                  value={formatHumanFriendlyDate(upload_date)}
                />
                <div style={{ marginTop: '-3rem' }}>
                  <c.Checkbox
                    test_id="checkbox-autodetect-filedate"
                    onClick={() => this.setState({
                      autodetect_file_date: !autodetect_file_date,
                      calendar_open: false,
                    })}
                    checked={autodetect_file_date}
                  >
                    Autodetect date
                  </c.Checkbox>
                </div>

                <c.DropdownList
                  onClick={this.onAlbumlistClick}
                  open={albumlist_open}
                  items={albumlist}
                  label="ALBUM"
                  value={selected_album_name}
                />
                <c.DropdownList
                  onClick={this.onFilelistClick}
                  open={filelist_open}
                  custom_items={filelist_custom_items}
                  label="FILES"
                  value={files_label}
                />

                {platform.isHoverAvailable() && (
                  <div
                    className="drag-target"
                    style={drag_active ? { backgroundColor: 'rgba(255, 255, 255, 0.15)' } : {}}
                    onDrop={(ev) => { this.setDragActive(false); this.dropHandler(ev); }}
                    onDragEnter={() => this.setDragActive(true)}
                    onDragLeave={() => this.setDragActive(false)}
                    onDragOver={ev => ev.preventDefault()}
                  >
                    <input
                      id="upload-files-input"
                      onChange={ev => this.dropHandler(ev)}
                      ref={(ref) => { this.file_input_ref = ref; }}
                      type="file"
                      multiple
                      accept="*/*"
                      style={{ display: 'none' }}
                    />

                    <c.StandaloneLabel
                      bright={drag_active}
                      style={{
                        fontSize: '1rem',
                        letterSpacing: '-0.01px',
                        textAlign: 'center',
                        fontWeight: drag_active ? 'bold' : 'normal',
                        margin: 0,
                        pointerEvents: 'none',
                      }}
                    >
                      <UploadingMessage
                        network_error={network_error}
                        not_enough_space={not_enough_space}
                        total_files={total_files}
                        uploaded_files={num_uploaded_files}
                      />
                      {!drag_active && (
                        <>DRAG AND DROP FILES INTO THE DASHED AREA<br />TO START UPLOAD</>
                      )}
                      {drag_active && 'DROP FILES TO START UPLOAD'}
                    </c.StandaloneLabel>
                  </div>
                )}

                {!platform.isHoverAvailable() && (
                  <>
                    <input
                      id="upload-files-input"
                      onChange={ev => this.dropHandler(ev)}
                      ref={(ref) => { this.file_input_ref = ref; }}
                      type="file"
                      multiple
                      accept="*/*"
                      style={{ display: 'none' }}
                    />
                    <UploadingMessage
                      not_enough_space={not_enough_space}
                      style={{ marginTop: '3rem' }}
                      total_files={total_files}
                      uploaded_files={num_uploaded_files}
                    />
                  </>
                )}

                <c.SuperWhiteButton
                  onClick={() => this.file_input_ref.click()}
                  title={platform.isHoverAvailable() ? '...OR BROWSE' : 'BROWSE'}
                />

                { num_failed_files > 0 && (
                  <c.DangerButton
                    style={{ marginTop: '1rem' }}
                    onClick={() => this.handleRetryFailed()}
                    title="RETRY FAILED"
                  />
                )}

                {/* <c.WhiteButton
                    style={{marginTop: "1rem", marginBottom: "5rem"}}
                    disabled={total_files > (num_uploaded_files + num_failed_files)}
                    onClick={
                        () => history.push(`/view/${selected_album.getAlbumIdentifier()}`)
                    }
                    title="VIEW ALBUM" /> */}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export const UploadPage = withRouter(UploadPageComponent);
