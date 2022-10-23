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

import React, { useState } from 'react';

import * as c from './Controls';
import { Select } from './JSXFlow';

export const useAlert = () => {
  const [alert, setAlert] = useState(null);
  return [<Alert {...{ alert, setAlert }} />, setAlert];
};

const Alert = ({ alert, setAlert }) => (
  <Select option={alert == null ? 0 : 1}>
    <></>
    <c.Alert
      icon={alert.icon}
      text={alert.text}
      onClick={() => setAlert(null)}
    />
  </Select>
);
