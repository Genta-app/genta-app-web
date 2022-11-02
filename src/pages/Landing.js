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

/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';

import { Link, useHistory } from 'react-router-dom';
// eslint-disable-next-line import/no-extraneous-dependencies
import { InView } from 'react-intersection-observer';

import { LandingTopBar } from '../components/Menu';

import * as constant from '../library/Constants';
import * as c from '../components/Controls';

import {
  CircleTick,
  IconPersonCircle,
  IconHDDNetwork,
  IconChatDots,
  IconTerminal,
  IconEnvelope,
  IconReddit, IconGitHub, IconDiscord
} from '../components/Icons';

import { PriceChartComponent } from '../components/PriceChartComponent';
import { KeyFeaturesComponent, LandingInfoBox } from '../components/LandingPageComponents';

import {
  LANDING_CLI_URL,
  ganalytics,
  LANDING_INVITE_APPLY,
  LANDING_REDDIT_LINK,
  LANDING_STEPS_FEEDBACK,
  useGentaAnalyticsOnce,
} from '../library/GentaAnalytics';

const LandingPage = ({ app, user }) => {
  useGentaAnalyticsOnce(() => ganalytics.page());

  const history = useHistory();

  return (
    <div className="landing-page">
      <LandingTopBar app={app} user={user} />
      <div className="landing-block-1">
        <div className="landing-text-1">Your Photos</div>
        <div className="landing-text-2">
          <nobr>Safely Encrypted.</nobr>
          {' '}
          <nobr>In Your Cloud</nobr>
        </div>
        <div className="landing-text-3">FOR A FAIR PRICE</div>
        <div className="landing-features">
          <div className="landing-feature-line">
            <div>
              <CircleTick height="1.6rem" width="1.6rem" />
            </div>
            <div>
                &nbsp;&nbsp;&nbsp;
            </div>
            <div>
              END-TO-END ENCRYPTION
            </div>
          </div>
          <div className="landing-feature-line">
            <div>
              <CircleTick height="1.6rem" width="1.6rem" />
            </div>
            <div>
                &nbsp;&nbsp;&nbsp;
            </div>
            <div>
              PROGRESSIVE PRICING
            </div>
          </div>
          <div className="landing-feature-line">
            <div>
              <CircleTick height="1.6rem" width="1.6rem" />
            </div>
            <div>
                  &nbsp;&nbsp;&nbsp;
            </div>
            <div>
              NO STORAGE CAPS
            </div>
          </div>
        </div>
        <div className="landing-signup-button">
          <c.SuperWhiteButton
            style={{
              border: '2px solid white',
              display: 'inline',
              backgroundColor: 'rgba(123, 76, 158, 1)',
              color: 'white',
              width: '17rem',
              margin: '0',
              fontWeight: '900',
            }}
            onClick={() => {
              ganalytics.track(LANDING_INVITE_APPLY);
              history.push('/signup');
            }}
            title="SIGN UP"
          />
        </div>
        <div className="landing-what-is-beta" style={{ width: '17rem' }}>
          GET 3 MONTHS FREE
          <br />
          US $0.99/month afterwards
        </div>
      </div>
      <KeyFeaturesComponent show_title />
      <div id="compare-pricing" className="section-header">
        <span>COMPARE</span>
        {' '}
        <span>PRICING</span>
      </div>
      <PriceChartComponent />
      <div className="section-header">
        <span>NEXT</span>
        {' '}
        <span>STEPS</span>
      </div>
      <InView
        as="div"
        className="landing-infobox-container"
        onChange={() => ganalytics.track('next-steps', { userAgent: navigator.userAgent })}
        triggerOnce
      >
        <LandingInfoBox title="Sign Up" leftIcon={IconPersonCircle}>
          Register now and have your first 3 months
          {' '}
          <b>FREE</b>
          . US&nbsp;$0.99/month afterwards
          <br />
          <br />
          <Link to="/signup" className="landing-infobox-link">SIGN UP</Link>
        </LandingInfoBox>
        <LandingInfoBox title="Attach Storage" leftIcon={IconHDDNetwork}>
          Leverage the full power of your Genta.app account, attach Backblaze B2 storage
          <br />
          <br />
          <Link to="/doc/attach-backblaze-storage" className="landing-infobox-link">SEE HOW</Link>
        </LandingInfoBox>
        <LandingInfoBox title="Install Genta.app CLI" leftIcon={IconTerminal}>
          Download and install
          {' '}
          <b>Genta.app</b>
          {' '}
          CLI tools for data sync, offline access and 3rd party services integration
          <br />
          <br />
          <a
            onClick={() => ganalytics(LANDING_CLI_URL)}
            href={constant.genta_app_cli_github_url}
            target="_blank"
            rel="noreferrer"
            className="landing-infobox-link"
          >
            GENTA.APP CLI on GITHUB
          </a>
        </LandingInfoBox>
        <LandingInfoBox title="Get Support" leftIcon={IconChatDots}>
          Have a question or just want to say hello? Welcome
          to
          {' '}
          our Discord support channel (no registration required)!
          <br />
          <br />
          <a
            target="_blank"
            rel="noreferrer"
            className="landing-infobox-link"
            href={constant.genta_app_discord_support_url}
          >
            GO TO SUPPORT CHANNEL
          </a>
        </LandingInfoBox>
        <LandingInfoBox title="Let Us Know" leftIcon={IconEnvelope}>
          Have a suggestion? Let us know what can we improve
          <br />
          <br />
          <br />
          <br />
          <Link
            onClick={() => {
              ganalytics.track(LANDING_STEPS_FEEDBACK);
              app.setShowFeedbackDialog(true);
            }}
            className="landing-infobox-link"
          >
            MESSAGE US
          </Link>
        </LandingInfoBox>
        <LandingInfoBox title="Join Us on Reddit" leftIcon={IconReddit}>
          Join our community on Reddit - the place where we share all
          the latest news and announcements
          <br />
          <br />
          <br />
          <a
            onClick={() => ganalytics(LANDING_REDDIT_LINK)}
            target="_blank"
            rel="noreferrer"
            href={constant.genta_app_subreddit_url}
            className="landing-infobox-link"
          >
            GO TO r/genta_app
          </a>
        </LandingInfoBox>
      </InView>
      <div className="landing-footer">
        <div>
          <div>
            <IconDiscord height={16} width={16} />
            &nbsp;&nbsp;
            <a
              target="_blank"
              rel="noreferrer"
              href={constant.genta_app_discord_support_url}
            >
              Discord
            </a>
          </div>
          <div>
            <IconReddit height={16} width={16} />
            &nbsp;&nbsp;
            <a
              target="_blank"
              rel="noreferrer"
              href={constant.genta_app_subreddit_url}
            >
              Reddit
            </a>
          </div>
          <div>
            <IconGitHub height={16} width={16} />
            &nbsp;&nbsp;
            <a
              target="_blank"
              rel="noreferrer"
              href={constant.genta_app_github_url}
            >
              GitHub
            </a>
          </div>
        </div>
        <div>
          <div><Link to="/doc/tos">Terms of Service</Link></div>
          <div><Link to="/doc/privacy-policy">Privacy Policy</Link></div>
          <div><Link to="/doc/information-policy">Information Policy</Link></div>
        </div>
      </div>
      <div style={{ margin: '2rem auto 5rem' }}>Copyright &copy; 2022 Genta.app</div>
    </div>
  );
};


export default LandingPage;
