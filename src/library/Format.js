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

/* eslint-disable no-bitwise */
/* eslint-disable prefer-template */

export const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const weekday_names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const full_weekday_names = ['Sunday', 'Monday', 'Tuesday',
  'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const month_numbers = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

// d: number in format YYYYMMDD
export function formatServerDate(d) {
  const year = d / 10000 | 0;
  const month = (d / 100 | 0) % 100;
  const day = (d % 100);
  return '' + day + ' ' + month_names[month - 1] + ' ' + year;
}

export function formatDate(d) {
  // eslint-disable-next-line no-use-before-define
  const sd = dateToYYYYMMDD(d);
  return formatServerDate(sd);
}

export function formatHumanFriendlyDate(d) {
  const d_year = d.getFullYear();
  const d_month = d.getMonth();
  const d_day = d.getDate();
  const d_weekday = d.getDay();

  const fd = `${full_weekday_names[d_weekday]}, ${formatDate(d)}`;

  const today = new Date();

  if (d_year === today.getFullYear()
    && d_month === today.getMonth()
    && d_day === today.getDate()) {
    return 'Today, ' + fd;
  }

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d_year === yesterday.getFullYear()
    && d_month === yesterday.getMonth()
    && d_day === yesterday.getDate()) {
    return 'Yesterday, ' + fd;
  }

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d_year === tomorrow.getFullYear()
    && d_month === tomorrow.getMonth()
    && d_day === tomorrow.getDate()) {
    return 'Tomorrow, ' + fd;
  }

  return fd;
}

export function parseYM(d) {
  const year = d / 100 | 0;
  const month = d % 100;
  return [year, month];
}

export function parseYMD(yyyymmdd) {
  const year = yyyymmdd / 10000 | 0;
  const month = (yyyymmdd / 100 | 0) % 100;
  const day = (yyyymmdd % 100);

  return new Date(year, month - 1, day);
}

// d: number in format YYYYMM
export function formatYM(d) {
  const year = d / 100 | 0;
  const month = d % 100;
  return '' + month_names[month - 1] + ', ' + year;
}

export function YMFromYearMonth(y, m) {
  return '' + y + month_numbers[m];
}

export function monthName(d /* YYYYMMDD */) {
  const month = (d / 100 | 0) % 100;
  return month_names[month - 1];
}

export function dateToYYYYMMDD(d) {
  const day_numbers = [
    '00', '01', '02', '03', '04', '05', '06', '07', '08', '09',
    '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
    '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
    '30', '31',
  ];

  return '' + d.getFullYear() + month_numbers[d.getMonth()] + day_numbers[d.getDate()];
}

const size_names = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

// show 3 most significant digits
export function formatSize(sz) {
  let name = '';
  let rounded_value = sz;

  for (let x = 0; x < size_names.length; x += 1) {
    const pow = 1000 ** (x + 1);
    if (sz < pow) {
      name = size_names[x];
      break;
    } else {
      rounded_value = Math.round(sz / pow * 10) / 10;
    }
  }

  let str = ('' + rounded_value).slice(0, 4);
  str = str.slice(0, 4);
  if (str[3] === '.') {
    str = str.slice(0, 3);
  }

  return str + ' ' + name;
}

// very loose validation
export function validateEmail(email) {
  const [user, domain] = email.split('@');
  if (user === undefined
    || user.length === 0
    || domain === undefined
    || domain.length === 0) {
    return false;
  }
  const [domainname, tld] = domain.split('.');
  return (
    domainname !== undefined
    && domainname.length > 0
    && tld !== undefined
    && tld.length > 0);
}

export function daysInMonth(year, month) {
  return (new Date(year, month + 1, 0)).getDate();
}

export function firstDayOfWeek(year, month) {
  return (new Date(year, month, 1)).getDay();
}

export function range(start, length) {
  if (length === 0) {
    return [];
  }
  return [...Array(length).keys()].map(x => x + start);
}
