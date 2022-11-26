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

/* eslint-disable prefer-destructuring */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable no-shadow */

import React from 'react';

import { Link, useHistory } from 'react-router-dom';

import * as c from './Controls';
import * as icon from './Icons';
import { ACCOUNT_TYPE_FREE, ACCOUNT_TYPE_STANDARD } from '../library/User';
import {
  WhatCanWeImproveButton,
  WhatCanWeImproveDialog,
  WhatCanWeImproveMenuItem
} from './WhatCanWeImprove.tsx';

import favicon from '../../static/favicon.png';
import { ganalytics, TOP_BAR_GUIDE } from '../library/GentaAnalytics.js';

import { If } from './JSXFlow';

export const MENU_ITEM_TYPE_ALBUM = 1;

export const LandingTopBar = ({ user, app }) => {
  const history = useHistory();

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-left">
          <WhatCanWeImproveButton {...{ app }} />
        </div>
        <div className="top-bar-logo">
          <img style={{ width: '1.2rem', height: '1.2rem', padding: '0 0.5rem' }} src={favicon} alt="Genta.app logo" />
          Genta.app
        </div>
        <div className="top-bar-controls">
          <div className="display-none-on-767px">
            <c.SuperWhiteButton
              style={{
                width: '12rem',
                height: '2rem',
                margin: '0 1.5rem',
                fontSize: '0.85rem'
              }}
              title="How to: Attach Storage"
              onClick={() => {
                ganalytics.track(TOP_BAR_GUIDE);
                history.push('/doc/attach-backblaze-storage');
              }}
            />
          </div>
          <Link className="landing-login-link" to="/login">LOG IN</Link>
        </div>
      </div>
      {app.getShowFeedbackDialog() && <WhatCanWeImproveDialog {...{ user, app }} />}
    </>
  );
};

export const TopBar = ({
  user, app, album, tools, upload, view, settings, handleZoomIn, handleZoomOut
}) => {
  const history = useHistory();
  const auth = user && user.getAuth();

  // eslint-disable-next-line camelcase
  let upload_link = '/upload';
  if (album) {
    upload_link += `/${album.getAlbumIdentifier()}`;
  }

  return (
    <>
      {app.getShowFeedbackDialog() && <WhatCanWeImproveDialog {...{ user, app }} />}
      <div className="top-bar">
        {auth && (
        <div className="top-bar-left">
          <c.MenuButton
            title="Show Menu"
            onClick={() => app.setShowSideMenu(true)}
            icon={<icon.List width="2rem" height="2rem" />}
          />
        </div>
        )}
        {auth || (
        <div className="top-bar-left">
          <WhatCanWeImproveButton {...{ app }} />
        </div>
        )}
        <div className="top-bar-logo"><a style={{ textDecoration: 'none' }} href="/">Genta.app</a></div>
        <div className="top-bar-controls">
          <If condition={!tools && auth && album !== undefined && view}>
            <c.MenuButton
              title="View album"
              onClick={() => history.push(`/view/${album.getAlbumIdentifier()}`)}
              icon={<icon.EyeFill width="2rem" height="2rem" />}
            />
          </If>
          <If condition={!tools && auth && handleZoomIn !== undefined}>
            <c.MenuButton
              title="Zoom In"
              onClick={handleZoomIn}
              icon={<icon.ZoomIn width="2rem" height="2rem" />}
            />
          </If>
          <If condition={!tools && auth && handleZoomOut !== undefined}>
            <c.MenuButton
              title="Zoom Out"
              onClick={handleZoomOut}
              icon={<icon.ZoomOut width="2rem" height="2rem" />}
            />
          </If>
          <If condition={!tools && auth && album !== undefined && settings}>
            <c.MenuButton
              title="Album Settings"
              onClick={() => history.push(`/album/${album.getAlbumIdentifier()}`)}
              icon={<icon.Gear width="2rem" height="2rem" />}
            />
          </If>
          <If condition={!tools && auth && upload}>
            <c.MenuButton
              title="Upload"
              onClick={() => history.push(upload_link)}
              icon={<icon.CloudArrowUp width="2rem" height="2rem" />}
            />
          </If>
          {tools}
        </div>
        {/* <div className="top-bar-account">{letter}</div> */}
      </div>
    </>
  );
};

export const SideMenu = ({
  user, app, albums, active, cal_year, cal_month, cal_day, active_days,
  onClose, onCalendarClick,
}) => {
  const history = useHistory();
  const active_marker = <div className="menu-active-marker" />;
  const active_album = albums.find(a => a.getAlbumIdentifier() === active);
  const min_date = active_album ? active_album.getMinDate() : null;
  const max_date = active_album ? active_album.getMaxDate() : null;

  const SideMenuAlbumBlock = ({
    title, active, empty_msg, album_list
  }) => (
    <>
      <div className="left-panel-menu-header">{title}</div>
      <If condition={album_list.length > 0}>
        {
          album_list.map((a) => {
            const album_ident = a.getAlbumIdentifier();
            const accepted = a.getAccepted();

            return (
              <div
                key={album_ident}
                className="left-panel-menu-item"
              >
                <Link
                  className="left-panel-menu-item-link"
                  data-testid={`link-${a.getAlbumName()}-${a.getOwnerEmail()}`}
                  onClick={() => {
                    history.push(`/view/${album_ident}`);
                    app.setShowSideMenu(false);
                  }}
                >
                  {a.getAlbumName()}

                  {active === album_ident && (
                  <div className="left-panel-menu-item-active">
                    {active_marker}
                  </div>
                  )}

                </Link>
                <If condition={a.getOwnerEmail().length > 0}>
                  <div className="left-panel-menu-subitem">{a.getOwnerEmail()}</div>
                  <If condition={!accepted}>
                    <div className="left-panel-menu-tag">new</div>
                  </If>
                </If>
              </div>
            );
          })
        }
      </If>
      <If condition={album_list.length === 0}>
        <div className="left-panel-menu-item">
          <div className="left-panel-menu-subitem text-grey">
            <span style={{ paddingRight: '0.5rem' }}><icon.IconInfoCircle /></span>
            {empty_msg}
          </div>
        </div>
      </If>
    </>
  );

  const SideMenuLink = ({
    to, icon, title, active
  }) => (
    <>
      <div className="left-panel-menu-icon-header">
        <Link
          className="left-panel-menu-item-link"
          onClick={() => {
            history.push(to);
            app.setShowSideMenu(false);
          }}
        >
          <If condition={active}>
            <div className="left-panel-menu-item-active">
              {active_marker}
            </div>
          </If>
          {icon}
          {title}
        </Link>
      </div>
    </>
  );

  const own_albums = albums.filter(a => a.getOwnerEmail().length === 0);
  const foreign_albums = albums.filter(a => a.getOwnerEmail().length !== 0);

  let years;
  let months;
  let days;

  if (cal_year > 0) {
    const rec = c.getCalendarRecordForDate(cal_year, cal_month, cal_day, active_days);
    years = rec.years;
    months = rec.months;
    days = rec.days;
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
    <div
      className="left-panel-wrapper"
      onClick={(e) => {
        if (e.target.className === 'left-panel-wrapper') {
          onClose();
        }
      }}
    >
      <div className="left-panel">
        <div className="left-panel-x">
          <c.MenuButton
            icon={<icon.IconCrossX />}
            title="Hide Menu"
            onClick={onClose}
          />
        </div>
        <div className="left-panel-menu">
          <div style={{ position: 'relative', paddingBottom: '2rem' }}>
            <SideMenuAlbumBlock
              title="YOUR ALBUMS"
              empty_msg="You have no albums"
              album_list={own_albums}
              active={active}
            />
            <Link
              title={user.getAccountType() === ACCOUNT_TYPE_FREE ? 'Upgrade to STANDARD to add albums' : 'Add new album'}
              to="/album/new"
              className="left-panel-add-album-fab"
            >
              +
            </Link>
          </div>
          <div className="left-panel-line" />
          <SideMenuAlbumBlock
            title="SHARED WITH YOU"
            empty_msg="Albums shared with you will be listed here"
            active={active}
            album_list={foreign_albums}
          />
          <div className="left-panel-line" />
          <If condition={user.getAccountType() === ACCOUNT_TYPE_STANDARD}>
            <SideMenuLink
              active={active === 'storage'}
              to="/storage"
              title="STORAGE"
              icon={<icon.IconCloud />}
            />
          </If>
          <SideMenuLink
            active={active === 'account'}
            to="/account"
            title="ACCOUNT"
            icon={<icon.IconPersonCircle />}
          />
          <SideMenuLink
            active={active === 'doc'}
            to="/doc"
            title="DOCUMENTATION"
            icon={<icon.IconQuestionDiamond width="28" height="28" />}
          />

          {/* <SideMenuLink active={active == "subscription"}
                    to="/sub" title="SUBSCRIPTION" icon=<icon.IconCreditCard /> /> */}
          <div className="left-panel-line" />
          <SideMenuLink to="/logout" title="LOG OUT" icon={<icon.IconDoorArrowOut />} />
          <If condition={cal_year > 0}>
            <div className="left-panel-line" />
            <c.Calendar
              {...{
                years, months, days, min_date, max_date
              }}
              embedded
              onClick={onCalendarClick}
            />
          </If>
          <div className="left-panel-line" />
          <WhatCanWeImproveMenuItem app={app} />

          {/* <div className="left-panel-line"></div>
                <div className="left-panel-menu-button-menu">
                <c.MenuButton
                    icon=<icon.Grid3x3 width="2rem" height="2rem" /> />
                <c.MenuButton
                    icon=<icon.Grid1x2 width="2rem" height="2rem" /> />
                </div> */}
        </div>
      </div>
    </div>
  );
};
