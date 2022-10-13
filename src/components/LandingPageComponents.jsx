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

import React from 'react';
import { Link } from 'react-router-dom';

import * as icon from './Icons';
import { genta_app_cli_github_url } from '../library/Constants';

const FeatureBlock = ({ leftIcon, title, children }) => {
  const LeftIcon = leftIcon;

  return (
    <>
      <div className="landing-feature-desc" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
        <div>
          <LeftIcon width="3rem" height="3rem" />
        </div>
        <div>
          <div className="landing-feature-desc-header">{ title }</div>
          <div className="landing-feature-desc-text">{ children }</div>
        </div>
      </div>
      <div className="landing-feature-desc-text-narrow">{ children }</div>
    </>
  );
};

export const KeyFeaturesComponent = ({ show_title }) => (
  <>
    {show_title
          && (
          <div className="section-header">
            <span>KEY</span>
            {' '}
            <span>FEATURES</span>
          </div>
          )}

    <FeatureBlock leftIcon={icon.ShieldLock} title="END-TO-END ENCRYPTION">
      All your media are encrypted in your browser as you add them. Only you have control
      over who can access your photos, videos and stories. Neither Genta.app nor storage
      provider can access your data in transit or at rest.
    </FeatureBlock>

    <FeatureBlock leftIcon={icon.PiggyBank} title="PROGRESSIVE PRICING">
      With progressively priced
      {' '}
      <b><Link to="/doc/attach-backblaze-storage">attached storage</Link></b>
      {' '}
      you pay for
      the amount of storage actually used.
      It's a cost-efficient
      alternative to "ladder" pricing, where services charge for a fixed amount of
      storage: 50GB, 200GB or 2000GB regardless of whether you use the full capacity or not.{' '}
      <b>
        <a href="#compare-pricing">
          See how much you can save.
        </a>
      </b>
    </FeatureBlock>

    <FeatureBlock leftIcon={icon.Database} title="UNCAPPED STORAGE">
      No minimum or maximum storage limits imposed on your account. Store as much or as little
      as you need with the
      {' '}
      <b><Link to="/doc/attach-backblaze-storage">attached storage</Link></b>
      . Grow at your own
      pace and
      don't be worried about hitting storage limits.
    </FeatureBlock>

    <FeatureBlock leftIcon={icon.IconUnlock} title="NO LOCK-IN">
      You retain full control over all your data. Our CLI tools (see below) make keeping local
      data copies easy. The
      {' '}
      <b><Link to="/doc/attach-backblaze-storage">attached storage</Link></b>
      {' '}
      model ensures your cloud data remains available
      even if you decide to leave Genta.app later.
    </FeatureBlock>

    <FeatureBlock leftIcon={icon.IconTerminal} title="COMMAND LINE TOOLS">
      With
      {' '}
      <b>Genta.app</b>
      {' '}
      Command Line Interface (CLI) Tools you can easily synchronize all your data into a local
      storage for offline access, backup or integration with other services.
    </FeatureBlock>

    <FeatureBlock leftIcon={icon.IconGitHub} title="OPEN SOURCE">
      <b>Genta.app</b>
      {' '}
      team is fully committed to the core principles Open Source. The source code for
      {' '}
      <b>Genta.app</b>
      {' '}
      CLI Tools is
      {' '}
      <a target="_blank" rel="noreferrer" href={genta_app_cli_github_url}>available on GitHub</a>
      . We are working to release the source code for the web application in the nearest future.
    </FeatureBlock>
  </>
);

export const LandingInfoBox = ({ leftIcon, title, children }) => {
  const LeftIcon = leftIcon;

  return (
    <div className="landing-infobox">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ margin: '3rem' }}>
          <LeftIcon width="5rem" height="5rem" />
        </div>
        <span style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>{ title }</span>
      </div>

      <div className="landing-infobox-text">
        { children }
      </div>
    </div>
  );
};
