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
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */

function ReadFileSlice(blob) {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject(new DOMException('ReadFileSlice read failed'));
    };
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsArrayBuffer(blob);
  });
}

function UInt32AsString(boxType) {
  const chars = [(boxType & 0xFF000000) >> 24,
    (boxType & 0x00FF0000) >> 16,
    (boxType & 0x0000FF00) >> 8,
    (boxType & 0x000000FF) >> 0,
  ];

  return String.fromCharCode(chars[0])
    + String.fromCharCode(chars[1])
    + String.fromCharCode(chars[2])
    + String.fromCharCode(chars[3]);
}

class Generic_Box {
  constructor(state) {
    const dv = state.view;
    let offs = 0;

    this._size = dv.getUint32(offs);
    offs += 4;
    this._type = dv.getUint32(offs);
    offs += 4;

    this._typename = UInt32AsString(this._type); // debugging

    if (this._size === 1) {
      // to properly support 64 bit sizes, we need BigInt support through
      // the entire editor. One day this will happen, but for now, there's
      // this workaround which helps in some cases
      dv.getUint32(offs); // ignore the upper part
      offs += 4;
      // TODO: we don't need this _largesize thing. Need single size
      // field that will handle 3 cases: 32bit size, 64bit size, size == 0
      this._largesize = dv.getUint32(offs);

      offs += 8;
    } else {
      this._largesize = null;
    }

    if (this._type === 0x75756964) /* 'uuid' */ {
      // this._usertype = new Uint8Array(b, offs, 16); // TODO: rewrite to use DataView
      offs += 16;
    } else {
      this._usertype = null;
    }

    this._generic_box_size = offs;
  }

    getSize = () => (this._size === 1 ? this._largesize : this._size);

    getTypename = () => this._typename;

    getChildren = () => [];
}

export class MP4File {
    loadSlice = async (state, size) => {
      if (state.inputIsMemory) {
        state.buffer = state.inputFile.slice(state.bufferOffs, state.bufferOffs + size).buffer;
      } else {
        // TODO: check that size doesn't exceed buffer size from offsets
        state.buffer = await ReadFileSlice(
          state.inputFile.slice(state.bufferOffs, state.bufferOffs + size)
        );
      }
      state.view = null; // debugging
      return state;
    }

    parse = async (mp4FileInput, isMemory) => {
      const bufferList = [];

      let state = {
        boxContext: {}, // used to interchange info between boxes as they are built
        parser: this,
        inputFile: mp4FileInput,
        inputIsMemory: isMemory,
        buffer: null,
        view: null,
        bufferOffs: 0, // buffer start offset in file
        fileSize: isMemory ? mp4FileInput.length : mp4FileInput.size,
      };

      while (state.bufferOffs < state.fileSize) {
        state = await this.loadSlice(state, 32);
        state.view = new DataView(state.buffer, 0, 32);

        const box = new Generic_Box(state);

        const sz = box.getSize();

        if (box._type !== 0x6d646174 /* mdat */) {
          state = await this.loadSlice(state, sz);
        }
        bufferList.push(state.buffer);

        state.bufferOffs += box.getSize();
      }

      return bufferList;
    }
}

export class MP4FileReader {
    loadFromFile = async (mp4FileInput) => {
      const f = new MP4File();
      return /* await */ f.parse(mp4FileInput, false);
    }

    loadFromMemory = async (binaryData) => {
      const f = new MP4File();
      return /* await */ f.parse(binaryData, true);
    }
}
