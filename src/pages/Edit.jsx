/* eslint-disable jsx-a11y/no-static-element-interactions */
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

import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';

import * as api from '../library/Api';

import { loadAndDecryptMainImage, uploadImageFile, MEDIA_TYPE_IMAGE } from '../library/File';

import * as icon from '../components/Icons';
import * as c from '../components/Controls';

import { LoadingScreen } from '../components/WaitForValidUser';
import { PageContentWrapper } from './PageContentWrapper';
import { useRefState, Select } from '../components/JSXFlow';
import { canvasToBlob } from '../library/Utils';
import { dateToYYYYMMDD } from '../library/Format';

// const Dialog = ({ title, exitPath }) => {
//   const history = useHistory();

//   return (
//     <div className="main-form">
//       <div className="form-title">{title}</div>
//       <c.WhiteButton
//         onClick={() => history.push(exitPath)}
//         title="OK"
//       />
//     </div>
//   );
// };

const OP_STATUS_EDIT = 0;
const OP_STATUS_SAVE_INPROGRESS = 1;
const OP_STATUS_SAVE_SUCCESS = 2;
const OP_STATUS_SAVE_ERROR = 3;

export const EditPage = (props) => {
  const { app, user, albums } = props;

  const { item_ident } = useParams();
  const history = useHistory();

  const [loaded, setLoaded] = useState(false);
  const [data_loaded, setDataLoaded] = useState(false);
  const [item, setItem] = useState(null);
  const [album, setAlbum] = useState(null);
  const [operation_status, setOperationStatus] = useState(OP_STATUS_EDIT);

  const [container_ref, setContainerRef] = useRefState(null);
  const [controls_ref, setControlsRef] = useRefState(null);
  const [crop_box_ref, setCropBoxRef] = useRefState(null);
  const [crop_canvas_ref, setCropCanvasRef] = useRefState(null);
  const [crop_out_img_ref, setCropOutImgRef] = useRefState(null);

  const [moving_top_ref, setMovingTop] = useRefState(false);
  const [moving_bottom_ref, setMovingBottom] = useRefState(false);
  const [moving_left_ref, setMovingLeft] = useRefState(false);
  const [moving_right_ref, setMovingRight] = useRefState(false);
  const [moving_clipbox_ref, setMovingClipBox] = useRefState(false);
  const [start_mouse_position_ref, setStartMousePosition] = useRefState(0);
  const [crop_width_ref, setCropWidth] = useRefState(0);
  const [crop_height_ref, setCropHeight] = useRefState(0);
  const [crop_x_ref, setCropX] = useRefState(0);
  const [crop_y_ref, setCropY] = useRefState(0);

  const [canvas_inited, setCanvasInited] = useState(false);

  const loadItem = async () => {
    if (!loaded && albums !== null && albums.length > 0) {
      setLoaded(true);
      setCropX(0);
      setCropY(0);

      const [file_list, album_list] = await api.apiGetFile(item_ident, albums);
      if (file_list !== null && file_list.length > 0) {
        setItem(file_list[0]);
        setAlbum(album_list[0]);
        await loadAndDecryptMainImage(app, album_list[0], file_list[0]);
        setDataLoaded(true);
        setCanvasInited(false);
      }
    }
  };

  const initCanvas = () => {
    // eslint-disable-next-line eqeqeq
    if (!canvas_inited && crop_out_img_ref.current && crop_out_img_ref.current.naturalHeight != 0) {
      setCanvasInited(true);
      const nw = crop_out_img_ref.current.naturalWidth;
      const nh = crop_out_img_ref.current.naturalHeight;

      const r = nw / nh;
      crop_canvas_ref.current.width = nw;
      crop_canvas_ref.current.height = nh;
      crop_canvas_ref.current.style.width = `${crop_out_img_ref.current.width}px`;
      crop_canvas_ref.current.style.height = `${crop_out_img_ref.current.width / r}px`;

      const ctx = crop_canvas_ref.current.getContext('2d');
      ctx.drawImage(crop_out_img_ref.current, 0, 0);

      // set left margin

      const container_w = container_ref.current.clientWidth;
      const image_w = crop_out_img_ref.current.clientWidth;
      const m = (container_w - image_w) / 2;

      crop_out_img_ref.current.style.marginLeft = `${m}px`;
      crop_box_ref.current.style.marginLeft = `${m}px`;

      // offset controls

      controls_ref.current.style.marginTop = `calc(${crop_out_img_ref.current.height}px + 2rem)`;
    }
  };

  const updateImages = () => {
    if (!data_loaded) {
      return;
    }

    if (crop_out_img_ref.current !== null) {
      crop_out_img_ref.current.onload = () => {
        crop_box_ref.current.style.width = `${crop_out_img_ref.current.width}px`;
        crop_box_ref.current.style.height = `${crop_out_img_ref.current.height}px`;
        setCropWidth(crop_out_img_ref.current.width);
        setCropHeight(crop_out_img_ref.current.height);
        initCanvas();
      };
      crop_out_img_ref.current.src = item.getImageDataURL();
      return;
    }

    if (crop_canvas_ref.current !== null) {
      if (crop_out_img_ref.current.loaded) {
        initCanvas();
      }
    }
  };

  const grabTopHandle = (ev) => {
    setMovingTop(true);
    setStartMousePosition(ev.screenY);
  };

  const grabBottomHandle = (ev) => {
    setMovingBottom(true);
    setStartMousePosition(ev.screenY);
  };

  const grabLeftHandle = (ev) => {
    setMovingLeft(true);
    setStartMousePosition(ev.screenX);
  };

  const grabRightHandle = (ev) => {
    setMovingRight(true);
    setStartMousePosition(ev.screenX);
  };

  const grabClipBox = (ev) => {
    if (
      !moving_top_ref.current
      && !moving_bottom_ref.current
      && !moving_left_ref.current
      && !moving_right_ref.current
    ) {
      setMovingClipBox(true);
      setStartMousePosition([ev.screenX, ev.screenY]);
    }
  };

  const slide = (ev) => {
    if (moving_top_ref.current) {
      let delta = ev.screenY - start_mouse_position_ref.current;

      delta = Math.max(delta, -crop_y_ref.current);
      delta = Math.min(delta, crop_height_ref.current - 1);

      setStartMousePosition(start_mouse_position_ref.current + delta);

      const new_height = crop_height_ref.current - delta;
      const translate = crop_y_ref.current + delta;

      setCropHeight(new_height);
      setCropY(translate);

      crop_canvas_ref.current.style.transform = `translate(${-crop_x_ref.current}px, ${-translate}px)`;
      crop_box_ref.current.style.transform = `translate(${crop_x_ref.current}px, ${translate}px)`;
      crop_box_ref.current.style.height = `${new_height}px`;
    } else if (moving_bottom_ref.current) {
      let delta = ev.screenY - start_mouse_position_ref.current;

      const full_height = crop_out_img_ref.current.height;

      delta = Math.min(delta, full_height - crop_height_ref.current - crop_y_ref.current);
      delta = Math.max(delta, 1 - crop_height_ref.current);

      setStartMousePosition(start_mouse_position_ref.current + delta);

      const new_height = crop_height_ref.current + delta;

      setCropHeight(new_height);

      crop_box_ref.current.style.height = `${new_height}px`;
    } else if (moving_left_ref.current) {
      let delta = ev.screenX - start_mouse_position_ref.current;

      delta = Math.max(delta, -crop_x_ref.current);
      delta = Math.min(delta, crop_width_ref.current - 1);

      setStartMousePosition(start_mouse_position_ref.current + delta);

      const new_width = crop_width_ref.current - delta;
      const translate = crop_x_ref.current + delta;

      setCropWidth(new_width);
      setCropX(translate);

      crop_canvas_ref.current.style.transform = `translate(${-translate}px, ${-crop_y_ref.current}px)`;
      crop_box_ref.current.style.transform = `translate(${translate}px, ${crop_y_ref.current}px)`;
      crop_box_ref.current.style.width = `${new_width}px`;
    } else if (moving_right_ref.current) {
      let delta = ev.screenX - start_mouse_position_ref.current;

      const full_width = crop_out_img_ref.current.width;

      delta = Math.min(delta, full_width - crop_width_ref.current - crop_x_ref.current);
      delta = Math.max(delta, 1 - crop_width_ref.current);

      setStartMousePosition(start_mouse_position_ref.current + delta);

      const new_width = crop_width_ref.current + delta;

      setCropWidth(new_width);

      crop_box_ref.current.style.width = `${new_width}px`;
    } else if (moving_clipbox_ref.current) {
      const [mx, my] = start_mouse_position_ref.current;
      let delta_x = ev.screenX - mx;
      let delta_y = ev.screenY - my;

      setStartMousePosition([mx + delta_x, my + delta_y]);

      delta_x = Math.max(-crop_x_ref.current, delta_x);
      delta_y = Math.max(-crop_y_ref.current, delta_y);

      const full_width = crop_out_img_ref.current.width;
      const full_height = crop_out_img_ref.current.height;

      delta_x = Math.min(delta_x, full_width - crop_width_ref.current - crop_x_ref.current);
      delta_y = Math.min(delta_y, full_height - crop_height_ref.current - crop_y_ref.current);

      const translate_x = crop_x_ref.current + delta_x;
      const translate_y = crop_y_ref.current + delta_y;

      setCropX(translate_x);
      setCropY(translate_y);

      crop_canvas_ref.current.style.transform = `translate(${-translate_x}px, ${-translate_y}px)`;
      crop_box_ref.current.style.transform = `translate(${translate_x}px, ${translate_y}px)`;
    }
  };

  const stopSlide = () => {
    setMovingTop(false);
    setMovingBottom(false);
    setMovingLeft(false);
    setMovingRight(false);
    setMovingClipBox(false);
  };

  const hasChanges = () => {
    if (crop_x_ref.current > 0 || crop_y_ref.current > 0) {
      return true;
    }

    if (crop_out_img_ref.current === null) {
      return false;
    }

    const full_width = crop_out_img_ref.current.width;
    const full_height = crop_out_img_ref.current.height;

    return crop_width_ref.current !== full_width || crop_height_ref.current !== full_height;
  };

  useEffect(() => { loadItem(); });
  useEffect(() => { updateImages(); }, [
    data_loaded,
    crop_out_img_ref,
    crop_canvas_ref,
    container_ref,
  ]);

  useEffect(() => {
    document.addEventListener('pointermove', slide);
    document.addEventListener('pointerup', stopSlide);

    return () => {
      document.removeEventListener('pointermove', slide);
      document.removeEventListener('pointerup', stopSlide);
    };
  }, []);

  const getRatios = () => {
    let w_ratio = 1;
    let h_ratio = 1;

    if (crop_out_img_ref !== null && crop_out_img_ref.current !== null) {
      w_ratio = crop_out_img_ref.current.naturalWidth / crop_out_img_ref.current.width;
      h_ratio = crop_out_img_ref.current.naturalHeight / crop_out_img_ref.current.height;
    }

    return [w_ratio, h_ratio];
  };

  const handleSave = async () => {
    setOperationStatus(OP_STATUS_SAVE_INPROGRESS);

    // const system_space_promise = (
    //   isAlbumInSystemBucket(album, buckets) ? api.apiSystemSpace() : null
    // );

    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = document.createElement('canvas');

    const [w_ratio, h_ratio] = getRatios();
    const w = Math.round(crop_width_ref.current * w_ratio);
    const h = Math.round(crop_height_ref.current * h_ratio);
    const x = Math.round(crop_x_ref.current * w_ratio);
    const y = Math.round(crop_y_ref.current * h_ratio);

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(crop_canvas_ref.current, x, y, w, h, 0, 0, w, h);

    const imsize = 500;
    let small_w;
    let small_h;
    let orientation = 0;

    if (w <= h) {
      small_w = Math.min(imsize, w);
      small_h = h * small_w / w;
    } else {
      small_h = Math.min(imsize, h);
      small_w = w * small_h / h;
      orientation = 1;
    }

    const small_canvas = document.createElement('canvas');
    small_canvas.width = small_w;
    small_canvas.height = small_h;

    const small_ctx = small_canvas.getContext('2d');
    small_ctx.imageSmoothingEnabled = false;
    small_ctx.drawImage(canvas, 0, 0, w, h, 0, 0, small_w, small_h);

    const image_buffer = await canvasToBlob(canvas);
    const thumb_buffer = await canvasToBlob(small_canvas);

    // TODO: check for system space

    // if (system_space_promise != null) {
    //   const system_space_avail = (
    //     Number(unpackValue((await system_space_promise).response).available_system_storage_bytes)
    //   );

    //   if (system_space_avail < (image_buffer.length + thumb_buffer.length)) {
    //     this.setState({ not_enough_space: true });
    //     this.setFileState(file_data, FILE_STATUS_ERROR);
    //     return;
    //   }
    // }

    try {
      const { file_identifier, status } = await uploadImageFile(
        app, user, album, item.getName(), item.getFileType(), item.getFileKey(), image_buffer,
        thumb_buffer, item.getDate(), orientation, MEDIA_TYPE_IMAGE /* image only for now */,
        1 /* encrypted */, item.getOrdering(),
        item.getFileIdentifier(),
      );

      if (file_identifier != null && status === 200) {
        setOperationStatus(OP_STATUS_SAVE_SUCCESS);
        setLoaded(false);
        setDataLoaded(false);
        setCanvasInited(false);
      } else {
        setOperationStatus(OP_STATUS_SAVE_ERROR);
      }

      // if (file_identifier != null) {
      //   this.setFileState(file_data, FILE_STATUS_SUCCESS);
      // } else {
      //   this.setFileState(file_data, FILE_STATUS_ERROR);
      //   if (status === 413) {
      //     this.setState({ not_enough_space: true });
      //   }
      // }
    } catch (e) {
      console.error(e);
      setOperationStatus(OP_STATUS_SAVE_ERROR);
    }

    setTimeout(() => setOperationStatus(OP_STATUS_EDIT), 3000);
  };

  const handleViewInAlbum = () => {
    history.push(`/view/${album.getAlbumIdentifier()}/${dateToYYYYMMDD(item.getDate())}`);
  };

  const [w_ratio, h_ratio] = getRatios();

  return (
    <Select option={data_loaded ? 0 : 1}>
      <PageContentWrapper {...props}>
        <Select option={operation_status}>
          <>
            {/* show no alert by default */}
          </>
          <>
            {/* show no alert when save in progress */}
          </>
          <c.Alert
            icon={<icon.IconInfoCircle />}
            text="Changes saved"
            onClick={() => setOperationStatus(OP_STATUS_EDIT)}
          />
          <c.Alert
            icon={<icon.IconExclCircle />}
            text="Save failed. Please try later"
            onClick={() => setOperationStatus(OP_STATUS_EDIT)}
          />
        </Select>

        <div className="edit-image-crop-info">
          {crop_x_ref.current}&nbsp;{crop_y_ref.current}&nbsp;&nbsp;&nbsp;
          {`${Math.round(crop_width_ref.current * w_ratio)}x${Math.round(crop_height_ref.current * h_ratio)}`}
        </div>
        <div className="edit-image-main">
          <div className="edit-image-container" ref={ref => setContainerRef(ref)}>
            <img
              draggable="false"
              alt=""
              className="edit-image-cropout"
              ref={ref => setCropOutImgRef(ref)}
            />
            <div
              className="edit-image-crop-box"
              ref={ref => setCropBoxRef(ref)}
            >
              <div
                className="edit-image-clipper-box"
                ref={ref => setCropBoxRef(ref)}
                onPointerDown={grabClipBox}
              >
                <canvas
                  draggable="false"
                  className="edit-image-cropin"
                  ref={ref => setCropCanvasRef(ref)}
                />
              </div>
              <div
                className="edit-image-crop-top-handle"
                onPointerDown={grabTopHandle}
              />
              <div
                className="edit-image-crop-bottom-handle"
                onPointerDown={grabBottomHandle}
              />
              <div
                className="edit-image-crop-left-handle"
                onPointerDown={grabLeftHandle}
              />
              <div
                className="edit-image-crop-right-handle"
                onPointerDown={grabRightHandle}
              />
            </div>
            <div className="edit-image-controls" ref={ref => setControlsRef(ref)}>
              <c.SuperWhiteButton
                title={operation_status === OP_STATUS_SAVE_INPROGRESS ? 'PLEASE WAIT...' : 'SAVE CHANGES'}
                onClick={handleSave}
                disabled={!hasChanges() || operation_status === OP_STATUS_SAVE_INPROGRESS}
              />
              <c.WhiteButton
                title="VIEW IN ALBUM"
                onClick={handleViewInAlbum}
                disabled={operation_status === OP_STATUS_SAVE_INPROGRESS}
              />
            </div>
          </div>
        </div>
      </PageContentWrapper>
      <div>
        <LoadingScreen />
      </div>
    </Select>

  );
};
