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

export const canvasToBlob = async (canvas) => {
  const blob = await (new Promise((resolve) => {
    // eslint-disable-next-line no-shadow
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.9);
  }));

  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
};
