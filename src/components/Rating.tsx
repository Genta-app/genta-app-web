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

// @ts-ignore
import React, { useState } from 'react';
import {
  ATTACH_BACKBLAZE_STORAGE_FEEDBACK_LIKE,
  ATTACH_BACKBLAZE_STORAGE_FEEDBACK_DISLIKE,
  ganalytics,
  useGentaAnalyticsOnce
} from '../library/GentaAnalytics.js';
import {
  IconThumbDown, IconThumbDownFilled, IconThumbUp, IconThumbUpFilled
} from './Icons';
import { Select, If } from './JSXFlow';

export default function Rating() {
  const [up, setUp] = useState(true);
  const [down, setDown] = useState(true);
  useGentaAnalyticsOnce(() => ganalytics.page());

  return (
    <p className="doc-para">
      Was the article useful?
      <button
        className="rating-button"
        type="button"
        onClick={() => {
          setUp(!up);
          setDown(true);
          ganalytics.track(ATTACH_BACKBLAZE_STORAGE_FEEDBACK_LIKE);
        }}
      >
        <Select option={up ? 0 : 1}>
          <IconThumbUp width={24} height={24} />
          <IconThumbUpFilled width={24} height={24} />
        </Select>
      </button>
      <button
        className="rating-button"
        type="button"
        onClick={() => {
          setDown(!down);
          setUp(true);
          ganalytics.track(ATTACH_BACKBLAZE_STORAGE_FEEDBACK_DISLIKE);
        }}
      >
        <Select option={down ? 0 : 1}>
          <IconThumbDown width={24} height={24} />
          <IconThumbDownFilled width={24} height={24} />
        </Select>
      </button>
      <If condition={!up || !down}>
        <p className="doc-para">
          Your feedback is appreciated!
        </p>
      </If>
    </p>
  );
}
