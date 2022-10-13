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

import { useState } from 'react';
import Analytics from 'analytics';

import { apiGentaAnalytics } from './Api';

function gentaAnalytics() {
  return {
    name: 'genta-analytics-plugin',
    config: {
    },
    initialize: () => {
    },
    page: ({ payload }) => {
      const p = payload;
      p.properties.ua = navigator.userAgent;
      apiGentaAnalytics(p);
    },
    track: ({ payload }) => {
      const p = payload;
      p.properties.ua = navigator.userAgent;
      apiGentaAnalytics(payload);
    },
    identify: ({ payload }) => {
      apiGentaAnalytics(payload);
    },
    loaded: () => true
  };
}

export const ganalytics = Analytics({
  app: 'genta.app',
  plugins: [
    gentaAnalytics(),
  ]
});

export const useGentaAnalyticsOnce = (callback) => {
  const [used, setUsed] = useState(false);
  if (!used) {
    callback();
    setUsed(true);
  }
};

export const LANDING_PRICE_CHART_MONTH_12 = 'landing-price-chart-month-12';
export const LANDING_PRICE_CHART_MONTH_24 = 'landing-price-chart-month-24';
export const LANDING_PRICE_CHART_MONTH_60 = 'landing-price-chart-month-60';
export const LANDNIG_PRICE_CHART_MONTH_120 = 'landing-price-chart-month-120';
export const LANDING_PRICE_CHART_STORAGE_1 = 'landing-price-chart-storage-1';
export const LANDING_PRICE_CHART_STORAGE_2 = 'landing-price-chart-storage-2';
export const LANDING_PRICE_CHART_STORAGE_5 = 'landing-price-chart-storage-5';
export const LANDING_PRICE_CHART_STORAGE_10 = 'landing-price-chart-storage-10';
export const LANDING_INVITE_APPLY = 'landing-apply-for-invite-link';
export const LANDING_STEPS_FEEDBACK = 'landing-send-us-feedback-steps';
export const LANDING_REDDIT_LINK = 'landing-reddit-link';
export const LANDING_CLI_URL = 'landing-genta-cli-link';

export const TOP_BAR_GUIDE = 'top-bar-guide-link';
export const TOP_BAR_FEEDBACK = 'top-bar-what-can-we-improve';

export const ATTACH_BACKBLAZE_STORAGE_FEEDBACK_LIKE = 'attach-backblaze-storage-feedback-like';
export const ATTACH_BACKBLAZE_STORAGE_FEEDBACK_DISLIKE = 'attach-backblaze-storage-feedback-dislike';
export const ATTACH_BACKBLAZE_STORAGE_DISCORD_LINK = 'attach-backblaze-storage-discord-link';
export const ATTACH_BACKBLAZE_STORAGE_NEW_ALBUM = 'attach-backblaze-storage-new-album';
export const ATTACH_BACKBLAZE_STORAGE_B2_CLI_LINK = 'attach-backblaze-storage-b2-cli-download-link';
export const ATTACH_BACKBLAZE_STORAGE_B2_SIGNUP_LINK = 'attach-backblaze-storage-b2-cli-signup-link';
