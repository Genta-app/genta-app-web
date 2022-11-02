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

import React from 'react';
import { Link } from 'react-router-dom';

import * as c from '../../components/Controls';
import { randomHexString } from '../../library/Crypto';

import {
  ATTACH_BACKBLAZE_STORAGE_B2_CLI_LINK,
  ATTACH_BACKBLAZE_STORAGE_B2_SIGNUP_LINK,
  ATTACH_BACKBLAZE_STORAGE_DISCORD_LINK,
  ganalytics,
  ATTACH_BACKBLAZE_STORAGE_NEW_ALBUM
} from '../../library/GentaAnalytics';

import discord_logo from '../../../static/discord-logo.png';
import Rating from '../../components/Rating';
import {
  b2_cli,
  b2_signup,
  genta_app_discord_support_url,
  genta_new_album,
  genta_storage,
  pricing_info,
  reliability
} from '../../library/Constants';

export const AttachBackblazeStoragePage = () => {
  const suffix = randomHexString(8);
  const bucket_name = `genta-app-bucket-${suffix}`;
  const cors_rule_name = `genta-app-cors-rule-${suffix}`;
  const key_name = `genta-app-access-key-${suffix}`;

  const authorize_account_command = 'b2 authorize-account <applicationKeyId> <applicationKey>';
  const create_bucket_command = `b2 create-bucket --corsRules '[{"allowedHeaders": ["range","x-bz-part-number","authorization","content-type","x-bz-file-name","x-bz-content-sha1"],"allowedOperations": ["b2_download_file_by_id","b2_upload_part","b2_upload_file","b2_download_file_by_name"],"allowedOrigins": ["https://genta.app"],"corsRuleName": "${cors_rule_name}","exposeHeaders": ["x-bz-file-name","x-bz-content-sha1","x-bz-part-number"],"maxAgeSeconds": 86400}]' ${bucket_name} allPrivate`;
  const generate_key_command = `b2 create-key --bucket ${bucket_name} ${key_name} "deleteFiles,listBuckets,listFiles,readBucketEncryption,readBuckets,readFiles,shareFiles,writeBucketEncryption,writeFiles"`;

  return (
    <div className="doc-main">
      <h1>Attaching a Backblaze B2 Storage</h1>

      <h2>Genta.app Approach to Storage</h2>

      <div className="doc-para">
        Each of your <b>Genta.app</b> albums is allocated within a storage. This is similar to how
        folders are created on your local disks, except the storage is in the cloud: with multiple
        copies for <a target="_blank" href={reliability} rel="noreferrer">reliability </a>
        and practically unlimited in size.
      </div>

      <div className="doc-para">
        Your <span className="doc-inline-caps">STANDARD</span> account comes with 1GB of "built-in"
        storage which is suitable for testing and evaluating the service as well as
        storing small volumes of pictures or document scans. To use it, select
        <span className="doc-inline-caps"> GENTA.APP STORAGE</span> for the
        <span className="doc-inline-caps"> STORAGE OPTION</span> when <Link to="/album/new"> creating a new album</Link>.
      </div>

      <div className="doc-para">
        Storing "day-to-day" albums with plenty of photos
        and videos requires a much larger storage
        capacity especially over time as the album grows.
        Think of an additional 1 to 5 GB consumed every month
        as a typical range, depending on quality and resolution
        of the photos as well as the total duration
        of video recorded.
      </div>

      <div className="doc-para">
        To use more storage with <b>Genta.app</b>, attach storage from a third-party provider -
        <b> Backblaze B2</b>. A key feature of <b>Backblaze B2</b>, along with excellent{' '}
        <a target="_blank" href={reliability} rel="noreferrer">reliability</a>
        , is progressive pricing where you pay for the amount of storage actually used.
        It's a cost-efficient alternative to "ladder" pricing, where services charge
        for a fixed amount of storage: 50GB, 200GB or 2000GB{' '}
        regardless of whether you use the full capacity or not.{' '}
        <b><a href="#compare-pricing">See how much you can save.</a></b>
      </div>

      <div className="doc-para">
        Detailed pricing information for <b>Backblaze B2</b> is available{' '}
        <a href={pricing_info}>here</a>
        , but in short: you get 10 GB free, pay a very competitive price for
        what you use on top of that and there's no volume cap.
        There is a charge on downloads over 1 GB per day
        which we believe should not incur any actual costs for typical personal use.
      </div>

      <div className="doc-para">
        Disclaimer: <b>Genta.app</b> is not affiliated with <b>Backblaze B2</b>. We are
        offering <b>B2</b> integration because we believe it provides our users{' '}
        with a reliable storage at a competitive cost.
      </div>

      <h2>Attaching a New B2 Storage Bucket</h2>

      <div className="doc-para">
        The easiest way to start with attached storage is to provide <b>Genta.app</b> with
        your Backblaze B2 master key and let us create and configure a new bucket and an
        application key to access to bucket.
      </div>

      <div className="doc-para">
        First, if you don't already have a Backblaze B2 account, follow{' '}
        <a
          onClick={() => ganalytics.track(ATTACH_BACKBLAZE_STORAGE_B2_SIGNUP_LINK)}
          href={b2_signup}
        >
          this link
        </a>
        {' '}and register. Make sure to save your master key ID and the master key somewhere handy.
      </div>

      <div className="doc-para">
        Next, follow <Link to="/storage/attach/create">this link</Link> to create and attach
        a new bucket using your B2 master key.
      </div>

      <div className="doc-para">
        Note: <b>Genta.app</b> will only use your master key to create the bucket and configure
        a limited application key to access the bucket. We will not store or use your master key
        for actual bucket access.
      </div>

      <h2>Manually Attach B2 Storage Bucket</h2>

      <div className="doc-para">
        You can also configure an B2 bucket manually (i.e. without providing your B2 master key
        to <b>Genta.app</b>) using the steps below.
      </div>

      <div className="doc-para">
        If you don't already have a Backblaze B2 account, follow{' '}
        <a
          onClick={() => ganalytics.track(ATTACH_BACKBLAZE_STORAGE_B2_SIGNUP_LINK)}
          href={b2_signup}
        >
          this link
        </a>
        {' '}and register.
      </div>

      <div className="doc-para">
        Next, install <b>Backblaze B2 </b>
        <a onClick={() => ganalytics.track(ATTACH_BACKBLAZE_STORAGE_B2_CLI_LINK)} href={b2_cli}>
          command line interface (CLI) tools
        </a>.
      </div>

      <div className="doc-para">
        Use command line terminal of your OS to run the
        following commands. First, authorize your installation of the tools,
        using your master key id/key that was provided to you during registration:
      </div>

      <div className="code">{authorize_account_command}</div>
      <div style={{ margin: '-3rem 0 3rem' }}>
        <c.CopyCodeToClipboardButton value={authorize_account_command} />
      </div>

      <div className="doc-para">
        Run the following command to create a new bucket with settings for <b>Genta.app</b>
        . Note that Backblaze B2 requires bucket names to be globally unique. The below
        command uses a securely generated random name suffix and should be safe
        to use as-is without a risk of creating a guessable bucket name:
      </div>

      <div className="code">{create_bucket_command}</div>
      <div style={{ margin: '-3rem 0 3rem' }}>
        <c.CopyCodeToClipboardButton value={create_bucket_command} />
      </div>

      <div className="doc-para">
        Save the bucket name and the bucket identifier that the{' '}
        command prints to the terminal as you will need them later.
      </div>

      <div className="doc-para">
        The last B2 setup step is to generate a new application key for <b>Genta.app</b>.
        The command refers to the bucket name from the previous command.
        If you used your own bucket name (or refreshed this page since), make sure
        to substitute it in the command below.
      </div>

      <div className="doc-para">
        <b>Note:</b> for security reasons, do not use your <b>master key</b> with
        <b> Genta.app</b>. Instead use the key generated by the below command:
      </div>

      <div className="code">{generate_key_command}</div>
      <div style={{ margin: '-3rem 0 3rem' }}>
        <c.CopyCodeToClipboardButton value={generate_key_command} />
      </div>

      <div className="doc-para">
        The above command should print the new application key id and the key to the terminal.
        Make sure you save them to provide to <b>Genta.app</b>, as described below.
      </div>

      <div className="doc-para">
        Go to <a target="_blank" href={genta_storage} rel="noreferrer">storage settings</a>{' '}
        in your <b>Genta.app</b> account and click the <b> "ATTACH STORAGE" </b>
        button. In the opened form enter the following values:

        <div style={{ margin: '3rem' }}>
          <div style={{ fontWeight: 'bold' }}>- BUCKET NAME</div>
          <div style={{ marginBottom: '1rem' }}>
            {bucket_name} (generated locally when you loaded the page)
          </div>
          <div style={{ fontWeight: 'bold' }}>- BUCKET ID</div>
          <div style={{ marginBottom: '1rem' }}>Bucket ID as printed by the create bucket command</div>
          <div style={{ fontWeight: 'bold' }}>- BUCKET KEY ID</div>
          <div style={{ marginBottom: '1rem' }}>App Key ID printed by the create key command</div>
          <div style={{ fontWeight: 'bold' }}>- BUCKET KEY</div>
          <div style={{ marginBottom: '1rem' }}>App Key printed by the create key command</div>
          <div style={{ fontWeight: 'bold' }}>- BUCKET PATH PREFIX</div>
          <div style={{ marginBottom: '1rem' }}>An optional path prefix, can be left empty</div>
        </div>
      </div>

      <div className="doc-para">
        Click <b>"ATTACH BUCKET"</b> and your newly attached storage is ready.
      </div>

      <h2>Start Using your New Storage</h2>

      <div className="doc-para">
        You can now
        {' '}
        <a
          onClick={() => ganalytics.track(ATTACH_BACKBLAZE_STORAGE_NEW_ALBUM)}
          href={genta_new_album}
        >
          create a new album
        </a> specifying the storage you just attached in the
        <b> "STORAGE OPTION"</b> drop-down box.
      </div>
      <Rating />
      <div className="doc-para">
        Have questions? Welcome to{' '}
        <a
          onClick={() => ganalytics.track(ATTACH_BACKBLAZE_STORAGE_DISCORD_LINK)}
          href={genta_app_discord_support_url}
        >
          our <img className="discord-logo" alt="discord_logo" src={discord_logo} />  Discord support channel
        </a> (no registration required).
      </div>
    </div>
  );
};
