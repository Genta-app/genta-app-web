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

/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/label-has-for */
/* eslint-disable no-shadow */
/* eslint-disable prefer-const */
/* eslint-disable no-mixed-operators */
/* eslint-disable react/button-has-type */
/* eslint-disable no-bitwise */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */

import React, { useState } from 'react';

import {
  weekday_names,
  month_names,
  parseYM,
  firstDayOfWeek,
  daysInMonth,
  range,
} from '../library/Format';


import * as icon from './Icons';


export const TextWithLabel = ({ iconComp, label, value }) => (
  <>
    <div className="form-text-with-label">

      <div className="form-control-label">
        {label}
      </div>
      { iconComp }
      {value}
    </div>
  </>
);

export const TextInput = ({
  iconComp, value, label, placeholder, red_text, onChange, test_id
}) => (
  <div className="form-input-wrapper" data-testid={test_id}>
    {label && (
    <div className="form-control-label">
      {label}
    </div>
    )}
    <div className="form-input-inner">
      { iconComp }
      <input
        type="text"
        onChange={onChange}
        value={value}
        className="form-input"
        placeholder={placeholder}
      />
      { red_text && <div className="redtext">{red_text}</div> }
    </div>
  </div>
);

export const ReadOnlyTextInput = ({ value, style }) => (
  <>
    <input
      type="text"
      readOnly
      style={style}
      value={value}
      className="form-readonly-input"
    />
  </>
);

export const PasswordInput = ({
  iconComp, clear, label, back_icon, placeholder, red_text, onChange, test_id
}) => (
  <div className="form-input-wrapper" data-testid={test_id}>
    {label && (
    <div className="form-control-label">
      {label}
    </div>
    )}
    <div className="form-input-inner">
      { iconComp }
      <input
        type={clear ? 'text' : 'password'}
        onChange={onChange}
        className="form-input"
        placeholder={placeholder}
      />
      { back_icon }
      { red_text && <div className="redtext">{red_text}</div> }
    </div>
  </div>
);

export const StaticText = ({
  label, margin, style, children, red_text
}) => (
  <div style={style} className={margin ? 'form-text-with-margin' : 'form-text'}>
    {label && (
    <div className="form-control-label">
      {label}
    </div>
    )}
    {children}
    { red_text && <div className="redtext">{red_text}</div> }
  </div>
);

export const Checkbox = ({
  checked, children, className, onClick, red_text, test_id
}) => (
  <>
    <label className={className || 'form-checkbox'}>
      <input type="checkbox" onChange={onClick} checked={checked} data-testid={test_id} />
      <div>
        {children}
      </div>
      { red_text && <div className="redtext">{red_text}</div> }
    </label>
  </>
);


export const ProgressBar = ({ title, value }) => {
  if (value === 0) {
    return (
      <>
        <div className="form-progress-bar">
          <span>{title}</span>
          <div className="form-progress-bar-bar" />
        </div>
      </>
    );
  }
  const perc = `${Math.round(value)}%`;
  return (
    <>
      <div className="form-progress-bar">
        <span>{title}</span>
        <span>{perc}</span>
        <div className="form-progress-bar-bar" />
        <div className="form-progress-bar-perc" style={{ width: perc }} />
      </div>
    </>
  );
};


export const Dropdown = ({
  label, value, children, open, onClick, style, disabled
}) => (
  <div className="form-dropdown-wrapper" style={style}>
    <div className="form-control-label">
      {label}
    </div>
    <div
      className={disabled ? 'form-dropdown-disabled' : 'form-dropdown'}
      onClick={() => (disabled ? {} : onClick('dropdown'))}
    >
      { value }
      <icon.IconChevron style={open ? { transform: 'rotate(180deg)' } : {}} />
    </div>
    { open && children}
  </div>
);

export const Calendar = ({
  years, months, days, onClick, embedded, min_date, max_date
}) => {
  const cur_month = months[1];
  const cur_year = years[1];
  const [min_year, min_month] = min_date === undefined ? [0, 0] : parseYM(min_date / 100 | 0);
  const [max_year, max_month] = max_date === undefined ? [10000, 12] : parseYM(max_date / 100 | 0);

  const back_year_enabled = Number(cur_year.label) > min_year;
  const forward_year_enabled = Number(cur_year.label) < max_year;
  const back_month_enabled = back_year_enabled
    || (month_names.indexOf(cur_month.label) + 1) > min_month;
  const forward_month_enabled = forward_year_enabled
    || (month_names.indexOf(cur_month.label) + 1) < max_month;

  const Bar = ({
    el_type, values, style, back_enabled, forward_enabled
  }) => (
    <div key={1} style={style} className="form-dropdown-calendar-bar">
      <div
        key={2}
        className="form-dropdown-calendar-item"
        onClick={back_enabled ? () => onClick(el_type, 'chevron-left') : null}
        style={{ textAlign: 'start', cursor: back_enabled ? 'pointer' : 'default' }}
      >
        {back_enabled && <icon.IconChevronCircle />}
      </div>
      {/* <div/> */}
      {/* <div key={3} className="form-dropdown-calendar-item text-dark-grey"
                onClick={() => onClick(el_type, values[0])}
                style={{textAlign: "end"}}>{values[0].label}</div> */}
      <div
        key={4}
        className="form-dropdown-calendar-item"
        onClick={() => onClick(el_type, values[1])}
        style={{ textAlign: 'center', cursor: 'default' }}
      >
        {values[1].label}
      </div>
      {/* <div key={5} className="form-dropdown-calendar-item text-dark-grey"
                onClick={() => onClick(el_type, values[2])}
                style={{textAlign: "end"}}>{values[2].label}</div> */}
      {/* <div/> */}
      <div
        key={6}
        className="form-dropdown-calendar-item"
        onClick={forward_enabled ? () => onClick(el_type, 'chevron-right') : null}
        style={{ textAlign: 'end', cursor: forward_enabled ? 'pointer' : 'default' }}
      >
        {forward_enabled && <icon.IconChevronCircle style={{ transform: 'rotate(180deg)' }} />}
      </div>
    </div>
  );

  const Line = ({ el_type, values, style }) => (
    <div style={style} className="form-dropdown-calendar-line">
      { values.map((v, k) => {
        let value_cn;
        if (v.selected) {
          value_cn = 'form-dropdown-calendar-line-selected';
        } else if (v.active) {
          value_cn = 'form-dropdown-calendar-line-active';
        } else {
          value_cn = 'form-dropdown-calendar-line-inactive';
        }

        if (!v.selected && el_type === 'days' && v.month === cur_month.month) {
          value_cn += ' form-dropdown-calendar-line-current';
        }

        return (
          <div
            className={value_cn}
            onClick={() => v.active && onClick(el_type, v)}
            // eslint-disable-next-line react/no-array-index-key
            key={k}
          >
            {v.label}
          </div>
        );
      })}
    </div>
  );


  const weekday_values = weekday_names.map((x, index) => ({
    label: x,
    index,
    active: !embedded,
  }));
  const cn = embedded ? 'form-dropdown-calendar-panel-wrapper-embedded'
    : 'form-dropdown-calendar-panel-wrapper';

  return (
    <>
      <div className={cn}>
        <div className="form-dropdown-calendar-panel">
          <Bar
            el_type="months"
            values={months}
            back_enabled={back_month_enabled}
            forward_enabled={forward_month_enabled}
          />
          <Line
            style={{ margin: '2rem 0', color: 'rgba(255, 255, 255, 0.5)' }}
            el_type="weekdays"
            values={weekday_values}
          />
          <Line
            style={{ color: 'rgba(255, 255, 255, 0.75)' }}
            values={days}
            el_type="days"
          />
          <Bar
            el_type="years"
            style={{ marginTop: '2.5rem' }}
            values={years}
            back_enabled={back_year_enabled}
            forward_enabled={forward_year_enabled}
          />
        </div>
      </div>
    </>
  );
};

export const DropdownCalendar = ({
  label, value, years, months, days, open, onClick, disabled
}) => (
  <>
    <Dropdown {...{
      label, value, onClick, open, disabled
    }}
    >
      <Calendar {...{
        years, months, days, onClick
      }}
      />
    </Dropdown>
  </>
);

export const StandaloneLabel = ({ style, bright, children }) => (
  <>
    <div style={style} className={`form-standalone-label ${bright ? 'text-action' : ''}`}>
      {children}
    </div>
  </>
);

const CommentEditBase = ({
  value, selected, onSelected, onSave, onCancel, can_delete, can_select
}) => {
  const [val, setVal] = useState(value);

  const edit_buttons = (
    <>
      <MenuButton
        data-testid="text-save-button"
        title="Save"
        icon={<icon.IconCheck width="28" height="28" />}
        onClick={() => onSave(val)}
      />
      <MenuButton
        data-testid="text-cancel-button"
        title="Cancel"
        icon={(
          <div style={{ display: 'inline-block', margin: '5px' }}>
            <icon.IconCrossX width="16" height="16" />
          </div>
)}
        onClick={onCancel}
      />
      {can_delete && (
      <MenuButton
        data-testid="text-delete-button"
        icon={<icon.WasteBin width="23" height="23" />}
        title="Delete Text"
        onClick={() => onSave('')}
      />
      )}
    </>
  );

  if (can_select) {
    return (
      <>
        <textarea
          lines="2"
          onChange={ev => setVal(ev.target.value)}
          value={val}
          className="view-album-photo-thumb-comment-edit"
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <MenuButton
              data-testid="text-select-button"
              title={selected ? 'Unselect' : 'Select'}
              icon={selected ? <icon.CircleThumbSelectCheck width="28" height="28" /> : <icon.CircleThumbSelect width="28" height="28" />}
              onClick={onSelected}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {edit_buttons}
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <textarea
        lines="2"
        onChange={ev => setVal(ev.target.value)}
        value={val}
        className="view-album-photo-thumb-comment-edit"
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
        {edit_buttons}
      </div>
    </>
  );
};

export const LargeViewEditComment = props => (
  <>
    <div className="view-large-album-photo-comment-edit-wrapper">
      <CommentEditBase {...props} />
    </div>
  </>
);

export const ThumbCommentEdit = (props) => {
  const { thumb_size } = props;
  return (
    <>
      <div className={`view-album-photo-thumb-comment-edit-wrapper-${thumb_size}`}>
        <CommentEditBase {...props} />
      </div>
    </>
  );
};

export const ParagraphEdit = props => (
  <>
    <div className="view-album-para-edit-wrapper">
      <CommentEditBase {...props} />
    </div>
  </>
);

export const DropdownList = ({
  label, value, items, custom_items, open, onClick, style
}) => (
  <Dropdown style={style} onClick={onClick} label={label} open={open} value={value}>
    <div className="form-dropdown-list">
      { items !== undefined && items.map(x => (
        <div
          className="form-dropdown-list-item"
          key={x.label}
          onClick={() => onClick('item', x)}
        >
          {x.label}
        </div>
      )) }
      { custom_items !== undefined && custom_items }
    </div>
  </Dropdown>
);

export const ButtonBase = ({
  disabled, onClick, title, style, className, autoFocus
}) => (
  <>
    <button
      {...{
        autoFocus,
        className,
        style,
        disabled,
        onClick,
      }}
    >
      {title}
    </button>
  </>
);

export const PrimaryButton = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-100 form-button-primary"
  />
);

export const SecondaryButton = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-100 form-button-secondary"
  />
);

export const WarningButton = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-100 form-button-warning"
  />
);

export const DangerButton = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-100 form-button-danger"
  />
);


export const SuperWhiteButton = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-100 form-button-superwhite"
  />
);

export const WhiteButton = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-100 form-button-white"
  />
);

export const PrimaryButtonSm = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-50 form-button-primary"
  />
);

export const SecondaryButtonSm = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-50 form-button-secondary"
  />
);

export const WarningButtonSm = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-50 form-button-warning"
  />
);

export const DangerButtonSm = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-50 form-button-danger"
  />
);

export const WhiteButtonSm = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-50 form-button-white"
  />
);

export const SuperWhiteButtonSm = props => (
  <ButtonBase
    {...props}
    className="form-button form-control-w-50 form-button-superwhite"
  />
);

export function MenuButton({
  icon, label, noHover, width, height, title, onClick, className, ...props
}) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPreseed] = useState(false);

  let cName = 'view-album-photo-thumb-menu-item';
  if (hovered && !noHover) {
    cName += ' bg-white-25';
  }
  if (pressed) {
    cName += ' text-action';
  }

  return (
    <div
      {...props}
      className={className}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseUp={() => setPreseed(false)}
      onMouseDown={() => setPreseed(true)}
      onClick={onClick}
    >

      <div className={cName}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {icon}
        </div>
        {label && <div className="view-album-photo-thumb-menu-item-label">{label}</div>}
      </div>
    </div>
  );
}

export const ControlLine = ({ children }) => (
  <>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'end' }}>
      { children }
    </div>
  </>
);

export const Form = ({ title, children }) => (
  <>
    <div className="main3">
      {/* <div className="left-panel-with-logo">
            <div className="left-panel-logo">genta.app</div>
        </div> */}
      <div className="main-signup-panel">
        <div className="main-form3">
          <div className="form-title">{title}</div>
          {children}
        </div>
      </div>
    </div>
  </>
);

export const Alert = ({ iconComp, text, onClick }) => (
  <>
    <div className="alert">
      <div
        className="text-danger"
        style={{ marginRight: '2rem', display: 'inline-block' }}
      >
        {iconComp}
      </div>
      {text}
      <div style={{ marginLeft: '2rem', display: 'inline-block' }}>
        <MenuButton
          width="1.1rem"
          height="1.1rem"
          icon={<icon.IconCrossX />}
          onClick={onClick}
          title="Close"
        />
      </div>
    </div>
  </>
);

export const CopyToClipboardButton = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const ic = copied
    ? <icon.ClipboardCheck width="1.2rem" height="1.2rem" />
    : <icon.Clipboard width="1.2rem" height="1.2rem" />;

  return (
    <div style={{ position: 'relative' }}>
      <MenuButton
        icon={ic}
        title="Copy URL to Clipboard"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
        }}
      />
      {copied && (
      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translate(-50%, 0)',
        bottom: '-0.9rem',
        color: 'white',
        fontSize: '0.8rem'
      }}
      >
        Copied!
      </div>
      )}
    </div>
  );
};

// note that cal_day can be null, in which case no date will be selected
// in the calendar
export function getCalendarRecordForDate(cal_year, cal_month, cal_day, act_days) {
  const active_days = (act_days === undefined) ? {} : act_days;

  // get list of start-of-the-week-aligned days with the month in the middle
  // prefixed/postfixed by days from surrounding months
  const getAllCalendarDaysForMonth = (year, month) => {
    const fdow = firstDayOfWeek(year, month);
    const dim = daysInMonth(year, month);

    const prev_month = (month === 0) ? 11 : month - 1;
    const prev_year = (prev_month === 11) ? (year - 1) : year;
    const dipm = daysInMonth(prev_year, prev_month);

    let prev_month_days = range(dipm - fdow + 1, fdow);
    if (prev_month_days.length === 0) {
      prev_month_days = range(dipm - fdow + 1 - 7, 7);
    }

    const days = range(1, dim);
    let rem_days = 7 - (prev_month_days.length + days.length) % 7;
    if (rem_days < 4) {
      rem_days += 7;
    }
    let next_month_days = range(1, rem_days);
    if (prev_month_days.length + days.length + next_month_days.length < 42) {
      next_month_days = range(1, rem_days + 7);
    }

    const next_month = (month === 11) ? 0 : month + 1;
    const next_year = (next_month === 0) ? (year + 1) : year;

    return [prev_year, prev_month, prev_month_days,
      days, next_year, next_month, next_month_days];
  };

  const isActive = (year, month, day) => Object.keys(active_days).length === 0
    || year in active_days
    && active_days[year].includes(year * 10000 + (month + 1) * 100 + day);

  let [
    prev_month_year,
    prev_month,
    prev_month_days,
    days,
    next_month_year,
    next_month,
    next_month_days,
  ] = getAllCalendarDaysForMonth(cal_year, cal_month);

  prev_month_days = prev_month_days.map(x => ({
    label: x,
    month: prev_month,
    year: prev_month_year,
    selected: false,
    active: isActive(prev_month_year, prev_month, x),
  }));

  days = days.map(x => ({
    label: x,
    month: cal_month,
    year: cal_year,
    selected: x === cal_day,
    active: isActive(cal_year, cal_month, x),
  }));

  next_month_days = next_month_days.map(x => ({
    label: x,
    month: next_month,
    year: next_month_year,
    selected: false,
    active: isActive(next_month_year, next_month, x),
  }));

  const years = [cal_year - 1, cal_year, cal_year + 1]
    .map(x => ({ label: x }));
  const months = [
    month_names[prev_month], month_names[cal_month], month_names[next_month]]
    .map(x => ({ label: x, month: month_names.indexOf(x) }));

  const all_days = prev_month_days.concat(days).concat(next_month_days);

  return {
    years,
    months,
    days: all_days,
  };
}

export const WhitePill = ({ children, title }) => (
  <span title={title} className="form-pill">
    {children}
  </span>
);

export const FullScreenAlert = ({ children }) => (
  <div className="full-screen-alert">
    <div className="full-screen-alert-inner">
      {children}
    </div>
  </div>
);

export const CopyCodeToClipboardButton = ({ value }) => {
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ position: 'relative', width: '5rem' }}>
      <button
        className="copy-code-button"
        title="Copy to Clipboard"
        onClick={() => {
          navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
      >
        Copy
      </button>
      {copied && (
      <div style={{
        position: 'absolute',
        left: '100%',
        top: '0',
        color: 'white',
        fontSize: '0.8rem'
      }}
      >
        Copied!
      </div>
      )}
    </div>
  );
};
