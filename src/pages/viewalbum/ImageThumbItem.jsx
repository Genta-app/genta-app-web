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
/* eslint-disable react/destructuring-assignment */
/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable prefer-template */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-else-return */
/* eslint-disable react/no-unused-state */
/* eslint-disable no-mixed-operators */
/* eslint-disable lines-between-class-members */


import React from 'react';
import ReactMarkdown from 'react-markdown';

import * as icon from '../../components/Icons';
import * as c from '../../components/Controls';
import * as platform from '../../library/Platform';

import { DirectLinkDialog, ConfirmDeleteDialog, MovingDialog } from './ViewAlbumDialogs';

import { If } from '../../components/JSXFlow';

import {
  STOCK_FILE_TYPE_IMAGE,
  STOCK_FILE_TYPE_VIDEO,
} from '../../library/File';

const PositionMarker = ({ left, onClick }) => {
  const style = left ? { left: '-2.5rem' } : { right: '-2.5rem' };
  return (
    <div className="view-album-photo-thumb-move-pos-marker" style={style}>
      <c.MenuButton icon={<icon.MountainFourArrows />} title="Move Here" onClick={onClick} />
    </div>
  );
};

export class ImageThumbItem extends React.Component {
  MODE_DEFAULT = 0;
  MODE_SHOW_MENU = 1;
  MODE_CONFIRM_DELETE = 2;
  MODE_EDIT_COMMENT = 3;
  MODE_DIRECT_LINK = 4;

  constructor(props) {
    super(props);
    this.state = {
      mode: this.MODE_DEFAULT,
      direct_link: null,
    };
  }

  canShowMenu = () => {
    const { mode } = this.state;
    const {
      page,
      item,
      moving,
      left_pad,
      right_pad
    } = this.props;

    return (
      !moving
      && !left_pad
      && !right_pad
      && (
        page.state.selected_items.length === 0
        || page.state.selected_items.length === 1
        && page.state.selected_items[0] === item
      )
      && (mode === this.MODE_DEFAULT || mode === this.MODE_SHOW_MENU));
  }

    editComment = () => {
      const { item } = this.props;
      this.setState({ mode: this.MODE_EDIT_COMMENT, edit_comment_text: item.getComment() });
    }

    renderSelection() {
      const { item, page, selected } = this.props;

      if (!item.getCanDeleteFile()) {
        return <></>;
      }

      const ic = (
        selected
          ? <icon.CircleThumbSelectCheck width="1.5rem" height="1.5rem" />
          : <icon.CircleThumbSelect width="1.5rem" height="1.5rem" />
      );

      return (
        <div
          onMouseEnter={() => {
            this.setState({ mode: this.MODE_SHOW_MENU });
          }}
          onMouseLeave={() => {
            this.setState({ mode: this.MODE_DEFAULT });
          }}
        >
          <c.MenuButton
            key={1}
            noHover
            className="view-album-photo-thumb-select"
            icon={ic}
            title="Select Item"
            onClick={() => page.handleItemSelectClick(item)}
          />
        </div>
      );
    }

    renderItemMenu(is_image) {
      const { item, page, history } = this.props;

      const dim = '1.6rem';

      if (!item.getCanEditFile()) {
        return <></>;
      }

      return (
        <div
          onMouseEnter={() => {
            if (this.canShowMenu()) {
              this.setState({ mode: this.MODE_SHOW_MENU });
            }
          }}
          onMouseLeave={() => {
            this.setState({ mode: this.MODE_DEFAULT });
          }}
          className="view-album-photo-thumb-menu"
        >
          <If condition={is_image && item.getCanEditFile() === 1}>
            <c.MenuButton
              key={6}
              data-testid="thumb-menu-crop"
              icon={<icon.Crop width={dim} height={dim} />}
              title="Crop Item"
              onClick={() => history.push(`/edit/${item.getFileIdentifier()}`)}
            />
          </If>
          <If condition={is_image}>
            <c.MenuButton
              key={1}
              data-testid="thumb-menu-direct-link"
              icon={<icon.ChainLinks width={dim} height={dim} />}
              onClick={async () => {
                await this.setState({ mode: this.MODE_DIRECT_LINK, direct_link: null });
                const url = await page.createDirectLink(item);
                await this.setState({ direct_link: url });
              }}
              title="Direct Link"
            />
          </If>
          <c.MenuButton
            key={2}
            data-testid="thumb-menu-move-image"
            icon={<icon.FourArrows width={dim} height={dim} />}
            onClick={() => {
              this.setState({ mode: this.MODE_DEFAULT });
              page.handleStartMovingThumbs([item]);
            }}
            title="Move Item"
          />
          <c.MenuButton
            key={4}
            data-testid="thumb-menu-para-above"
            icon={<icon.TextAboveImage width={dim} height={dim} />}
            onClick={() => page.handleAddText(item, true)}
            title="+ Paragraph Above"
          />
          <c.MenuButton
            key={3}
            data-testid="thumb-menu-para-below"
            icon={<icon.TextBelowImage width={dim} height={dim} />}
            onClick={() => page.handleAddText(item, false)}
            title="+ Paragraph Below"
          />
          <c.MenuButton
            key={5}
            data-testid="thumb-menu-comment"
            icon={<icon.BaloonText width={dim} height={dim} />}
            onClick={this.editComment}
            title="Image Comment"
          />
          <If condition={item.getCanDeleteFile() === 1}>
            <c.MenuButton
              key={6}
              data-testid="thumb-menu-delete"
              icon={<icon.WasteBin width={dim} height={dim} />}
              title="Delete Item"
              onClick={() => this.setState({ mode: this.MODE_CONFIRM_DELETE })}
            />
          </If>
        </div>
      );
    }

    renderComment() {
      const { item, page, thumb_size } = this.props;
      const { mode } = this.state;

      if (mode === this.MODE_EDIT_COMMENT) {
        return (
          <c.ThumbCommentEdit
            {...{ thumb_size }}
            value={item.getComment()}
            onSave={async (text) => {
              await page.handleSaveImageComment(item, text);
              this.setState({ mode: this.MODE_DEFAULT });
            }}
            onCancel={() => this.setState({ mode: this.MODE_DEFAULT })}
          />
        );
      } else {
        const comment = item.getComment();
        if (comment.length > 0) {
          return (
            <div
              className={`view-album-photo-thumb-comment-${thumb_size}`}
              onClick={this.editComment}
            >
              <ReactMarkdown>{item.getComment()}</ReactMarkdown>
            </div>
          );
        } else {
          return <></>;
        }
      }
    }

    render() {
      const {
        item,
        album,
        page,
        moving,
        // downloading,
        left_pad,
        right_pad,
        selected,
        can_delete,
        thumb_size
      } = this.props;
      const { mode, direct_link } = this.state;

      // const video_url = item.getVideoStreamURL();
      const key = item.getFileIdentifier();
      const image_data_loaded = item.getDataLoaded();

      let dialog = null;

      if (mode === this.MODE_CONFIRM_DELETE) {
        dialog = (
          <ConfirmDeleteDialog
            global={thumb_size !== page.THUMB_SIZE_22}
            key={key + '-delete-dialog'}
            onDelete={() => {
              this.setState({ mode: this.MODE_DEFAULT });
              page.handleDeleteFile(item);
            }}
            onClose={() => this.setState({ mode: this.MODE_SHOW_MENU })}
          />
        );
      }

      if (mode === this.MODE_DIRECT_LINK) {
        dialog = (
          <DirectLinkDialog
            global={thumb_size !== page.THUMB_SIZE_22}
            key={key + '-direct-link-dialog'}
            direct_link={direct_link}
            item={item}
            page={page}
            onClose={() => this.setState({ mode: this.MODE_SHOW_MENU })}
          />
        );
      }

      if (moving) {
        dialog = (
          <MovingDialog
            global={thumb_size !== page.THUMB_SIZE_22}
            key={key + '-moving-dialog'}
            item={item}
            page={page}
            onCancel={page.handleCancelMoveThumb}
          />
        );
      }

      // show 'in-place' dialog only for 22vw thumbs only on desktop
      if (dialog != null && platform.isHoverAvailable() && thumb_size === '22') {
        return dialog;
      }

      const global_moving_mode = moving || left_pad || right_pad;
      const can_show_menu = this.canShowMenu();

      const file_type = item.getFileType();
      const is_video = file_type === STOCK_FILE_TYPE_VIDEO;
      const is_image = file_type === STOCK_FILE_TYPE_IMAGE;

      const render_selection = (mode === this.MODE_SHOW_MENU
          || selected) && !global_moving_mode
          || (page.state.selected_items.length > 0 && !platform.isHoverAvailable());

      const on_context_menu = (ev) => {
        ev.preventDefault();
        if (mode === this.MODE_DEFAULT) {
          page.setFocusItem(this);
          this.setState({ mode: this.MODE_SHOW_MENU });
        } else if (mode === this.MODE_SHOW_MENU) {
          this.setState({ mode: this.MODE_DEFAULT });
          page.setFocusItem(null);
        }
      };

      return (
        <>
          <div data-testid="image-thumb-item">
            <div
              id={key}
              key={key}
              ref={ref => page.imageThumbRefCallback(ref, item)}
              className={`view-album-photo-thumb-${thumb_size}`}
            >
              {is_video /* && video_url == null */ && (
                <div
                  onClick={() => page.gotoLargeView(album, item, true)}
                  onContextMenu={on_context_menu}
                  className="view-album-photo-thumb-download"
                >
                  <icon.PlayCircle width="4rem" height="4rem" />
                </div>
              )}

              {/* {is_video && video_url != null
                && <video src={video_url} controls autoPlay></video>} */}

              {image_data_loaded /* && video_url == null */ && (
                <img
                  src={item.getThumbDataURL()}
                  onMouseEnter={() => {
                    if (platform.isHoverAvailable()) {
                      // NOTE: it can be MODE_SHOW_MENU with a pending reset to MODE_DEFAULT
                      // therefore we still need to setState(MODE_SHOW_MENU) even
                      // if the current mode is MODE_SHOW_MENU
                      if (this.state.mode === this.MODE_DEFAULT
                        || this.state.mode === this.MODE_SHOW_MENU) {
                        this.setState({ mode: this.MODE_SHOW_MENU });
                        page.setFocusItem(this);
                      }
                    }
                  }}
                  onMouseLeave={() => {
                    if (platform.isHoverAvailable()) {
                      if (this.state.mode === this.MODE_SHOW_MENU) {
                        this.setState({ mode: this.MODE_DEFAULT });
                        page.setFocusItem(null);
                      }
                    }
                  }}
                  onClick={() => {
                    page.gotoLargeView(album, item);
                  }}
                  onContextMenu={on_context_menu}
                />
              )}

              {/* debugging */}
              {/* <div style={{position: "absolute", top: 0, left: 0}}>
                {item.getFileIdentifier()}</div> */}

              {mode === this.MODE_SHOW_MENU && can_show_menu
                && this.renderItemMenu(is_image, is_video, can_delete)}
              {render_selection && this.renderSelection()}
              {left_pad && (
                <PositionMarker
                  left
                  onClick={() => page.handleClickPositionMarker(item, true)}
                />
              )}
              {right_pad && (
                <PositionMarker
                  onClick={() => page.handleClickPositionMarker(item, false)}
                />
              )}
            </div>
            {this.renderComment()}
          </div>
          {dialog}
        </>
      );
    }
}
