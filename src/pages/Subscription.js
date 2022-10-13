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
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/no-access-state-in-setstate */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-one-expression-per-line */

import React from 'react';
import { Link, Redirect } from 'react-router-dom';

import * as c from '../components/Controls';
import * as icon from '../components/Icons';
import * as m from '../components/Menu';

import { formatDate } from '../library/Format';

// active_price_item: the one user is subscribed to (if any)
// selected_price_item: currently selected in the radio list

// const SubscriptionItem = ({title, items, neg_items, children,
//        price, selected_price_item, active_price_item, onPriceChange}) => {
//
//    return <div className="col-4" style={{maxWidth: "30rem"}}>
//    <div className="h-100 bg-light rounded-3 shadow-lg p-5 position-relative">
//        <div className="d-flex justify-items-top">
//        <h3 className="mb-4 d-inline">{title}</h3>
//
//        { price.length > 0 &&
//        <span className="d-inline-block ms-5 mb-5 align-items-end">
//            <span className={`align-middle h2 fw-normal
//                            text-muted text-center text-middle`}>$</span>
//            <span className="align-middle price display-2 fw-normal text-primary">
//                {selected_price_item}</span>
//            <span className="d-inline-block align-middle h3 fs-lg fw-medium text-muted">
//                USD per<br/>month</span>
//        </span> }
//
//        </div>
//
//        { price.length > 0 && <div className="mb-3">
//            { price.map((pr, index) =>
//                <span className="d-inline-block ms-4 form-check my-2" key={pr[0]}>
//                    <input className="form-check-input" type="radio"
//                        name="radio" onChange={() => onPriceChange(pr[0])}
//                        id={"radio-" + index} checked={selected_price_item == pr[0]} />
//                    <label className="form-check-label"  style={{fontSize: "1.05rem"}}
//                        htmlFor={"radio-" + index}>{pr[1]}</label>
//                    {pr[0] == active_price_item &&
//                    <i className="bi bi-check-circle-fill ms-3 text-success"
//                    style={{fontSize: "1.1rem"}}></i>}
//                </span>
//            )}
//        </div>}
//
//        <ul className="list-unstyled pt-1" style={{marginBottom: "6rem"}}>
//            { items.map((item, index) =>
//                <li key={index} className="d-flex align-items-center mb-2">
//                    <i className="ai-check fs-xl text-primary me-2"></i>
//                    <span>{item}</span>
//                </li>
//            )}
//            { neg_items != undefined && neg_items.map((item, index) =>
//                <li key={index + 100} className="d-flex align-items-center mb-2">
//                    <i className="ai-x fs-xl text-danger me-2"></i>
//                    <span>{item}</span>
//                </li>
//            )}
//        </ul>
//        {children}
//    </div>
//    </div>;
// }
//
// const SelectSubscriptionForm = ({user, active_price_item}) => {
//
//    const [selected_price, setSelectedPrice] = useState(
//        active_price_item == undefined ? 5 : active_price_item);
//
//    const {is_nosub, is_viewer, is_expired_trial, is_trial, is_active_trial, is_paid} =
//        user.getSubscriptionStatusMap();
//
//    return (<>
//       <div className="container-fluid position-relative zindex-5 pb-4 mb-md-3"
//           style={{marginTop: "-350px"}}>
//           <div className="row">
//               <div className="col-4">
//               </div>
//               <div className="col-4  mb-5">
//               <h2 className="text-white text-center text-nowrap">
//               {active_price_item > 0 || "Please Select "} Your Subscription</h2>
//               </div>
//               <div className="col-4">
//               </div>
//           </div>
//
//           <div className="row g-3 justify-content-center">
//                <SubscriptionItem key={1} price={[]} title="Viewer" items={
//                    [
//                        "Free forever",
//                        "View albums shared with you by others",
//                    ]}>
//                    <div className="position-absolute text-center mt-5 mx-5"
//                        style={{bottom: "2rem", left: 0, right: 0}}>
//                        <form action="/api/v1/subscription" method="POST">
//                        <input type="hidden" name="subscription" value="viewer" />
//                        <input type="hidden" name="price" value={0} />
//                        {is_viewer && <button type="submit" className={
//                             "w-100 btn btn-success disabled"}>
//                             <i className="bi bi-check2-circle me-2"></i>Active
//                        </button>}
//
//                        {!is_viewer &&
//                        <button type="submit" className="w-100 btn btn-outline-primary">
//                            {is_nosub && "Activate"}
//                            {(is_paid || is_trial) && "Downgrade"}
//                        </button>
//                        }
//                       </form>
//                   </div>
//               </SubscriptionItem>
//
//               <SubscriptionItem key={3} title="Standard"
//                    selected_price_item={selected_price}
//                    active_price_item={active_price_item}
//                    onPriceChange={setSelectedPrice}
//                    price={[
//                       [5, <span>
//                            <span style={{display: "inline-block", width: "6rem"}}>100 GB</span>
//                            <span style={{display: "inline-block", width: "3rem"}}>$5</span>
//                            USD/month</span>],
//                       [10, <span><span style={{display: "inline-block", width: "6rem"}}>
//                            1 000 GB</span>
//                            <span style={{display: "inline-block", width: "3rem"}}>$10</span>
//                            USD/month</span>],
//                       [20, <span><span style={{display: "inline-block", width: "6rem"}}>
//                            2 000 GB</span>
//                            <span style={{display: "inline-block", width: "3rem"}}>$20</span>
//                            USD/month</span>],
//                       [50, <span><span style={{display: "inline-block", width: "6rem"}}>
//                            5 000 GB</span>
//                            <span style={{display: "inline-block", width: "3rem"}}>$50</span>
//                            USD/month</span>],
//                       [100, <span><span style={{display: "inline-block", width: "6rem"}}>
//                            10 000 GB</span>
//                            <span style={{display: "inline-block", width: "3rem"}}>$100</span>
//                            USD/month</span>],
//                   ]} items={[
//                       "Organize your photos & videos",
//                       "Add stories and comments",
//                       "Share your albums with other members",
//                       "Direct links to share photos with anyone",
//                       "View albums shared with you by others",
//                       "Attach your own buckets",
//                       "Create albums in your own buckets",
//                   ]}>
//                   <div className="position-absolute text-center mt-5 mx-5"
//                       style={{bottom: "2rem", left: 0, right: 0}}>
//                       {selected_price == active_price_item &&
//                       <button type="button"
//                           className="w-100 btn btn-success" disabled>
//                       <i className="bi bi-check2-circle me-2"></i>
//                       Active
//                       </button>
//                       }
//                       {/* stripe has no cors, cannot redirect from a script */}
//                       {selected_price == active_price_item ||
//                       <form action="/api/v1/subscription" method="POST">
//                       <input type="hidden" name="subscription" value="standard" />
//                       <input type="hidden" name="price" value={selected_price} />
//                       <button type="submit" className="w-100 btn btn-primary">
//                       Proceed to payment</button>
//                       </form>}
//                   </div>
//               </SubscriptionItem>
//
//               {(is_viewer || is_trial || is_nosub) &&
//               <SubscriptionItem key={2} price={[]} title="Free Trial" items={
//                   [
//                       "14 days free trial",
//                       "1 GB of storage space",
//                       "Organize your photos & videos",
//                       "Add stories and comments",
//                       "View albums shared with you by others",
//                   ]} neg_items={[
//                       "Share your albums with other members",
//                       "Direct links to share photos with anyone",
//                       "Attach your own buckets",
//                       "Create albums in your own buckets",
//                   ]}>
//                   <div className="position-absolute text-center mt-5 mx-5"
//                       style={{bottom: "2rem", left: 0, right: 0}}>
//                       {/*<div className="text-start fw-bold mb-4" style={{fontSize: "0.9rem"}}>
//                       Your payment details will be collected, however you will not be charged
//                       if you cancel your trial within 14 days
//                       </div>*/}
//                       <form action="/api/v1/subscription" method="POST">
//                       <input type="hidden" name="subscription" value="trial" />
//                       <input type="hidden" name="price" value={0} />
//
//                       {is_expired_trial && <button type="submit"
//                            className="w-100 btn btn-danger disabled">
//                            <i className="bi bi-x-circle me-2"></i>Expired
//                       </button>}
//
//                       {is_active_trial && <button type="submit"
//                            className="w-100 btn btn-success disabled">
//                            <i className="bi bi-check2-circle me-2"></i>Active
//                       </button>}
//
//                       {!is_trial && <button type="submit"
//                           className="w-100 btn btn-outline-primary">Start</button>}
//                       </form>
//                   </div>
//               </SubscriptionItem>}
//           </div>
//        </div>
//    </>);
// }
//
//
// const ViewerSubscriptionConfirmationMessage = () =>
//
//    <div className={`container-fluid position-relative text-center
//                    zindex-5 rounded-3 shadow-lg`}
//         style={{
//            backgroundColor: "rgba(255, 255, 255, 0.9)",
//            marginTop: "-250px",
//            maxWidth: "40rem",
//            padding: "5rem 3rem 5rem 3rem"
//            }}>
//         <h4 className="text-primary fw-bold">Thank you for using StockLock</h4>
//         <h2 className="text-primary" style={{margin: "3rem 0"}}>
//            Your <b>Viewer</b> subscription<br/>is now active</h2>
//
//        <div className="text-primary h6 m-5">
//        You may now view albums shared with you by your friends and family
//        </div>
//
//         <Link to="/albums" className="btn btn-success w-50">Go to Albums</Link>
//    </div>;
//
//
// const TrialSubscriptionConfirmationMessage = ({expires}) =>
//
//    <div className={`container-fluid position-relative text-center
//                    zindex-5 rounded-3 shadow-lg`}
//         style={{
//            backgroundColor: "rgba(255, 255, 255, 0.9)",
//            marginTop: "-250px",
//            maxWidth: "40rem",
//            padding: "5rem 3rem 5rem 3rem"
//            }}>
//         <h4 className="text-primary fw-bold">Thank you for using StockLock</h4>
//         <h2 className="text-primary" style={{margin: "3rem 0"}}>
//            Your <b>Trial</b> subscription<br/>will be active till {formatDate(expires)}</h2>
//
//        <div className="text-primary h6 m-5">
//        You may now start uploading and viewing your photos
//        </div>
//
//        <div className="d-flex justify-items-between">
//            <Link to="/albums" className="btn btn-success w-50 mx-2">Go to Albums</Link>
//            <Link to="/upload" className="btn btn-outline-primary w-50 mx-2">
//                Start uploading</Link>
//        </div>
//    </div>;
//
// const StandardSubscriptionConfirmationMessage = () =>
//
//    <div className={`container-fluid position-relative text-center
//                    zindex-5 rounded-3 shadow-lg`}
//         style={{
//            backgroundColor: "rgba(255, 255, 255, 0.9)",
//            marginTop: "-250px",
//            maxWidth: "40rem",
//            padding: "5rem 3rem 5rem 3rem"
//            }}>
//         <h4 className="text-primary fw-bold">Thank you for using StockLock</h4>
//         <h2 className="text-primary" style={{margin: "5rem 0"}}>
//            Your <b>Standard</b> subscription<br/>is now active</h2>
//        <div className="text-primary h6 m-5">
//        You may now start uploading and viewing your photos
//        </div>
//
//        <div className="d-flex justify-items-between">
//            <Link to="/albums" className="btn btn-success w-50 mx-2">Go to Albums</Link>
//            <Link to="/upload" className="btn btn-outline-primary w-50 mx-2">
//                Start uploading</Link>
//        </div>
//    </div>;
//
// const SubscriptionErrorMessage = () =>
//
//    <div className={`container-fluid position-relative text-center
//                    zindex-5 rounded-3 shadow-lg`}
//         style={{
//            backgroundColor: "rgba(255, 255, 255, 0.9)",
//            marginTop: "-350px",
//            maxWidth: "40rem",
//            padding: "5rem 3rem 5rem 3rem"
//            }}>
//         <h3 className="text-danger fw-bold">ERROR</h3>
//         <h5 style={{margin: "5rem 0", lineHeight: "2rem"}}>
//        There was an error processing your subscription<br />Please try
//        again later<br/>If the error persists, contact
//        <pre className="my-4">support@stocklock.net</pre>
//        We appreciate your patience
//        </h5>
//         <Link to="/subscription" className="btn btn-warning w-50">Back to Subscriptions</Link>
//    </div>;
//
// export class _SubscriptionPage extends React.Component {
//    constructor(props) {
//        super(props);
//    }
//
//    render() {
//        const {match, app, user} = this.props;
//
//        if (!user.getAuth()) {
//            if (app.isUserRecallComplete()) {
//                return <Redirect to="/login" />;
//            } else {
//                return <></>;
//            }
//        }
//
//        const {is_nosub, is_viewer, is_trial, is_paid, is_suberror} =
//            user.getSubscriptionStatusMap();
//
//        let content, active_price_item;
//
//        if (match.params.option == "confirm") {
//            if (is_viewer) {
//                content = <ViewerSubscriptionConfirmationMessage />
//            } else if (is_trial) {
//                content = <TrialSubscriptionConfirmationMessage
//                    expires={user.getSubscriptionEnd()} />
//            } else if (is_paid) {
//                content = <StandardSubscriptionConfirmationMessage />
//            }
//        } else {
//            const max_storage_gb = user.getMaxStorageGB();
//
//            if (is_paid) {
//                switch (max_storage_gb) {
//                case 100: active_price_item = 5; break;
//                case 1000: active_price_item = 10; break;
//                case 2000: active_price_item = 20; break;
//                case 5000: active_price_item = 50; break;
//                case 10000: active_price_item = 100; break;
//                }
//            }
//
//            if (is_viewer || is_paid || is_nosub || is_trial) {
//                content = <SelectSubscriptionForm user={user}
//                    active_price_item={active_price_item} />;
//            } else if (is_suberror) {
//                content = <SubscriptionErrorMessage />
//            }
//        }
//
//        // subscripton form
//        return <main className="page-wrapper" style={{height: "80vh"}}>
//            {/* Navbar (Floating dark) */}
//            {!is_nosub && <TopMenu user={user} />}
//            {/* Page content */}
//            <div className="position-relative bg-gradient" style={{height: "480px"}}>
//              <div className={`shape shape-bottom shape-slant
//                                bg-secondary d-none d-lg-block`}>
//                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3000 260">
//                  <polygon fill="currentColor" points="0,257 0,260 3000,260 3000,0">
//                  </polygon>
//                </svg>
//              </div>
//            </div>
//
//            { content }
//
//        </main>
//    }
// }

// /////////////////////////////

export function SubBlock({
  title,
  children,
  button,
  style
}) {
  return (
    <>
      <div className="sub-block" style={style}>
        {title}
        <div className="sub-block-item-list">
          {children}
        </div>
        <div className="sub-block-button">
          {button}
        </div>
      </div>
    </>
  );
}

export function SubBlockItem({ title }) {
  return (
    <>
      <div className="sub-block-item">
        <icon.IconBigDotFilled />
        {title}
      </div>
    </>
  );
}

export function StoragePriceSelect({
  storage_price,
  children,
}) {
  return (
    <div style={{
      padding: '0 2rem',
      top: '7rem',
      left: '-2rem',
      position: 'absolute',
      width: '100%',
      zIndex: 10,
    }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
      }}
      >
        <div style={{ fontWeight: '300', fontSize: '30px' }}>$</div>
        <div style={{ fontWeight: 'normal', fontSize: '64px' }}>
          {storage_price}
        </div>
        <div style={{
          marginLeft: '0.5rem',
          fontWeight: 'normal',
          fontSize: '14px'
        }}
        >
          USD per<br />month
        </div>
      </div>
      { children }
    </div>
  );
}

export class SubscriptionPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      storage_option: '100 GB',
      storage_price: 5,
      storage_optionlist_open: false,
    };
  }

  onStorageOptionsListClick = (el_type, value) => {
    // const {
    //   storage_option,
    //   storage_optionlist_open,
    // } = this.state;

    if (el_type === 'dropdown') {
      this.setState({ storage_optionlist_open: !this.state.storage_optionlist_open });
    } else {
      this.setState({
        storage_option: value[0],
        storage_price: value[3],
        storage_optionlist_open: false,
      });
    }
  }

  renderViewerConfirmationForm() {
    const { user, app, albums } = this.props;

    return (
      <>
        <div className="main">
          <m.TopBar user={user} app={app} albums={albums} />
          <m.SideMenu
            user={user}
            app={app}
            albums={albums}
            active="subscription"
          />

          <div className="main-panel">
            <div className="main-signup-panel">
              <div className="main-form">
                <div className="form-title">
                  Your VIEWER subscription is now active
                </div>

                <c.StaticText>
                  Thank you for using <b>genta.app</b> !
                </c.StaticText>

                <c.StaticText margin>
                  Albums shared with you will appear under the
                  SHARED WITH YOU section in the menu on the left
                </c.StaticText>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  renderTrialConfirmationForm(expires) {
    const { user, app, albums } = this.props;

    return (
      <>
        <div className="main">
          <m.TopBar user={user} app={app} albums={albums} />
          <m.SideMenu
            user={user}
            app={app}
            albums={albums}
            active="subscription"
          />
          <div className="main-panel">
            <div className="main-signup-panel">
              <div className="main-form">
                <div className="form-title">
                  Your FREE TRIAL <br />is now active
                </div>

                <c.StaticText>
                  Thank you for using <b>genta.app</b> !
                </c.StaticText>

                <c.StaticText>
                  Your free trial is active to {formatDate(expires)}
                </c.StaticText>

                <c.StaticText margin>
                  You may now start <Link to="/upload">uploading</Link> photos
                </c.StaticText>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // eslint-disable-next-line no-unused-vars
  renderStandardConfirmationForm(expires) {
    const { user, app, albums } = this.props;

    return (
      <>
        <div className="main">
          <m.TopBar user={user} app={app} albums={albums} />
          <m.SideMenu
            user={user}
            app={app}
            albums={albums}
            active="subscription"
          />
          <div className="main-panel">
            <div className="main-signup-panel">
              <div className="main-form">
                <div className="form-title">
                  Your subscription is now active
                </div>

                <c.StaticText>
                  Thank you for using <b>genta.app</b> !
                </c.StaticText>

                <c.StaticText margin>
                  You may now start <Link to="/upload">uploading</Link> photos
                </c.StaticText>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  renderChooseSubscriptionForm() {
    const { user, app, albums } = this.props;
    const {
      storage_optionlist_open,
      storage_option,
      storage_price,
    } = this.state;

    const {
      is_nosub,
      is_viewer,
      is_trial,
      is_paid,
      // is_suberror
    } = user.getSubscriptionStatusMap();

    const viewer_title = (
      <div
        style={{ borderColor: '#07A0C3' }}
        className="sub-block-title"
      >
        {`${is_viewer ? 'VIEWER: ACTIVE' : 'VIEWER'}`}
      </div>
    );
    const standard_title = (
      <div
        style={{ borderColor: '#657EE4' }}
        className="sub-block-title"
      >
        {`${is_paid ? 'STANDARD: ACTIVE' : 'STANDARD'}`}
      </div>
    );
    const trial_title = (
      <div
        style={{ borderColor: '#FC55FF' }}
        className="sub-block-title"
      >
        {`${is_trial ? 'FREE TRIAL: ACTIVE' : 'FREE TRIAL'}`}
      </div>
    );

    const viewer_button = (is_viewer
      ? <></>
      : (
        <>
          <form action="/api/v1/subscription" method="POST">
            <input type="hidden" name="subscription" value="viewer" />
            <input type="hidden" name="price" value={0} />
            <c.SecondaryButton title="ACTIVATE" style={{ width: '80%' }} /* TODO: DOWNGRADE */ />
          </form>
        </>
      )
    );

    const standard_button = (is_paid
      ? <></>
      : (
        <>
          <form action="/api/v1/subscription" method="POST">
            <input type="hidden" name="subscription" value="standard" />
            <input type="hidden" name="price" value={storage_price} />
            <input type="hidden" name="storage" value={storage_option} />
            <c.PrimaryButton title="PROCEED TO PAYMENT" style={{ width: '80%' }} />
          </form>
        </>
      )
    );

    const trial_button = (is_trial
      ? <></>
      : (
        <>
          <form action="/api/v1/subscription" method="POST">
            <input type="hidden" name="subscription" value="trial" />
            <input type="hidden" name="price" value={0} />
            <c.DangerButton
              title="START"
              disabled={is_paid || is_trial}
              style={{ width: '80%' }}
            />
          </form>
        </>
      )
    );

    const storage_list_items = [
      ['100 GB', '$ 5 USD/mo', 100, 5],
      ['1 000 GB', '$ 10 USD/mo', 1000, 10],
      ['2 000 GB', '$ 20 USD/mo', 2000, 20],
      ['5 000 GB', '$ 50 USD/mo', 5000, 50],
      ['10 000 GB', '$ 100 USD/mo', 10000, 100],
    ].map(x => (
      <div
        key={x[0]}
        className="sub-price-list-item"
        onClick={() => this.onStorageOptionsListClick('item', x)}
      >
        <div>{x[0]}</div>
        <div>{x[1]}</div>
      </div>
    ));

    const form_title = is_nosub ? 'Choose your Subscription' : 'Change Subscription';

    const show_side_menu = (is_viewer || is_paid || is_trial) && app.getShowSideMenu();
    // const main_panel_class = 'main-panel-no-menu';

    return (
      <>
        <div className="main">
          <m.TopBar user={user} app={app} />

          {show_side_menu && (
            <m.SideMenu
              user={user}
              app={app}
              albums={albums}
              onClose={() => app.setShowSideMenu(false)}
              active="subscription"
            />
          )}

          <div className="sub-main-panel">
            <div className="form-title">{form_title}</div>
            <div />
            <div />
            <SubBlock title={viewer_title} button={viewer_button}>
              <SubBlockItem title="FREE FOREVER" />
              <SubBlockItem title="VIEW SHARED ALBUMS" />
            </SubBlock>
            <SubBlock title={standard_title} button={standard_button}>
              {/* storage/price option form */}
              <StoragePriceSelect storage_price={storage_price}>
                <div style={{ padding: '0 3rem' }}>
                  <c.DropdownList
                    open={storage_optionlist_open}
                    onClick={this.onStorageOptionsListClick}
                    style={{ width: '100%' }}
                    label="SELECT STORAGE OPTION"
                    value={storage_option}
                    custom_items={storage_list_items}
                  />
                </div>
              </StoragePriceSelect>
              <SubBlockItem title="ORGANIZE PHOTOS & VIDEOS" />
              <SubBlockItem title="SHARE ANY NUMBER OF PEOPLE" />
              <SubBlockItem title="ADD STORIES AND COMMENTS" />
              <SubBlockItem title="ATTACH & USE YOUR OWN STORAGE" />
              <SubBlockItem title="DIRECT LINKS FOR QUICK SHARING" />
            </SubBlock>
            <SubBlock title={trial_title} button={trial_button}>
              <SubBlockItem title="14 DAYS FREE TRIAL" />
              <SubBlockItem title="1 GB STORAGE SPACE" />
              <SubBlockItem title="ORGANIZE PHOTOS & VIDEOS" />
              <SubBlockItem title="ADD STORIES AND COMMENTS" />
            </SubBlock>
          </div>
        </div>
      </>
    );
  }

  render() {
    // eslint-disable-next-line no-unused-vars
    const { match, app, user } = this.props;

    if (!user.getAuth()) {
      if (app.isUserRecallComplete()) {
        return <Redirect to="/login" />;
      } else {
        return <></>;
      }
    }

    // beta only //////////////////////////////////////////////////////////

    const form = document.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', '/api/v1/subscription');

    const subscriptionField = document.createElement('input');
    subscriptionField.setAttribute('type', 'hidden');
    subscriptionField.setAttribute('name', 'subscription');
    subscriptionField.setAttribute('value', 'standard');
    form.appendChild(subscriptionField);

    const priceField = document.createElement('input');
    priceField.setAttribute('type', 'hidden');
    priceField.setAttribute('name', 'price');
    priceField.setAttribute('value', '0');
    form.appendChild(priceField);

    const storageField = document.createElement('input');
    storageField.setAttribute('type', 'hidden');
    storageField.setAttribute('name', 'storage');
    storageField.setAttribute('value', '1');
    form.appendChild(storageField);

    document.body.appendChild(form);
    form.submit();

    return <></>;

    // end beta only //////////////////////////////////////////////////////

    // const {is_nosub, is_viewer, is_trial, is_paid, is_suberror} =
    //     user.getSubscriptionStatusMap();

    // if (match.params.option == 'status') {
    //     if (is_viewer) {
    //         return this.renderViewerConfirmationForm();
    //     } else if (is_trial) {
    //         return this.renderTrialConfirmationForm(user.getSubscriptionEnd());
    //     } else if (is_paid) {
    //         return this.renderStandardConfirmationForm();
    //     }
    // } else {
    //     return this.renderChooseSubscriptionForm();
    // }
  }
}
