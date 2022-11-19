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

import React, { useState, useRef } from 'react';

export const Select = ({ option, children }: {option: number, children: any}) => children[option];

export const If = ({ condition, children }: {condition: boolean, children: any}) => (
  condition ? children : null
);

export const ForEach = ({ itemList, render, keyFunc }) => {
  const Component = render;
  return itemList.map((item: any) => <Component key={keyFunc(item)} {...{ item }} />);
};

export const Log = ({ disable, message }) => {
  if (!disable) {
    console.log(message);
  }
  return <></>;
};

export const useRefState = (initializer) => {
  const [value, setValue] = useState(initializer);
  const valueRef = useRef(value);
  const setValueByRef = (val) => {
    valueRef.current = val;
    setValue(val);
  };
  return [valueRef, setValueByRef];
};
