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

export const ACCOUNT_TYPE_STANDARD = 'standard';
export const ACCOUNT_TYPE_FREE = 'free';

export class User {
  constructor(default_album_ident, default_bucket_ident, subscription_status) {
    this.auth = false;
    this.guest_list = [];
    this.share_request_list_to = [];
    this.host_list = [];
    this.default_album_ident = default_album_ident;
    this.default_bucket_ident = default_bucket_ident;
    this.subscription_status = subscription_status;
    this.max_storage_gb = 0;
    this.subscription_end = 0;
    this.account_type = null;
  }

  setAuth(auth) {
    this.auth = auth;
  }

  getAuth() {
    return this.auth;
  }

  setEmail(email) {
    this.email = email;
  }

  getEmail() {
    return this.email;
  }

  setEmailVerified(email_verified) {
    this.email_verified = email_verified;
  }

  getEmailVerified() {
    return this.email_verified;
  }

  getMasterKey() {
    return this.master_key;
  }

  setKeys(master_key, private_key, public_key, auth_key) {
    this.master_key = master_key;
    this.private_key = private_key;
    this.public_key = public_key;
    this.auth_key = auth_key;
  }

  getPrivateKey() {
    return this.private_key;
  }

  getPublicKey() {
    return this.public_key;
  }

  getAuthKey() {
    return this.auth_key;
  }

  setDefaultAlbumIdent(aidt) {
    this.default_album_ident = aidt;
  }

  getDefaultAlbumIdent() {
    return this.default_album_ident;
  }

  setDefaultBucketIdent(ident) {
    this.default_bucket_ident = ident;
  }

  getDefaultBucketIdent() {
    return this.default_bucket_ident;
  }

  getGuestList() {
    return this.guest_list;
  }

  setGuestList(guest_list) {
    this.guest_list = guest_list;
  }

  setShareRequestListToUser(share_request_list_to) {
    this.share_request_list_to = share_request_list_to;
  }

  getShareRequestListToUser() {
    return this.share_request_list_to;
  }

  setHostList(host_list) {
    this.host_list = host_list;
  }

  getHostList() {
    return this.host_list;
  }

  setSubscriptionStatus(s) {
    this.subscription_status = s;
  }

  getSubscriptionStatus() {
    return this.subscription_status;
  }

  isViewer() {
    return this.subscription_status === 'viewer';
  }

  isTrial() {
    return this.subscription_status === 'trial';
  }

  isActiveTrial() {
    const now = new Date();
    return this.isTrial() && this.subscription_end > now;
  }

  isExpiredTrial() {
    const now = new Date();
    return this.isTrial() && this.subscription_end < now;
  }

  isPaid() {
    return this.subscription_status === 'paid';
  }

  isNoSub() {
    return this.subscription_status === '';
  }

  isSubError() {
    return this.subscription_status === 'error';
  }

  getSubscriptionStatusMap() {
    return {
      is_nosub: this.isNoSub(),
      is_viewer: this.isViewer(),
      is_trial: this.isTrial(),
      is_expired_trial: this.isExpiredTrial(),
      is_active_trial: this.isActiveTrial(),
      is_paid: this.isPaid(),
      is_suberror: this.isSubError(),
    };
  }

  setMaxStorageGB(m) {
    this.max_storage_gb = m;
  }

  getMaxStorageGB() {
    return this.max_storage_gb;
  }

  setSubscriptionEnd(timestamp) {
    this.subscription_end = new Date(timestamp * 1000);
  }

  getSubscriptionEnd() {
    return this.subscription_end;
  }

  setAccountType(account_type) {
    this.account_type = account_type;
  }

  getAccountType() {
    return this.account_type;
  }
}
