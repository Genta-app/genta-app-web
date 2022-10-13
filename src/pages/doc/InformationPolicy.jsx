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
/* eslint-disable react/jsx-one-expression-per-line */

import React from 'react';

import { Link } from 'react-router-dom';

export const InformationPolicyPage = () => (
  <div className="doc-main">
    <h1>Information Policy</h1>

    <p>
      Thank you for using Genta.app!
    </p>

    <p>
      Please read this Information Policy carefully as it governs
      your use of the information provided by the website located
      at <Link to="https://genta.app">https://genta.app/</Link> and any related services.
    </p>

    <p>
      We (Genta.app, represented by our directors, subsidiaries, contractors, licensors,
      officers, agents, and employees, referred to as "we" or "us") provide the website
      and associated services, products, technologies, materials and resources (collectively
      referred to as "the service") at <Link to="https://genta.app">Genta.app</Link>.
    </p>

    <p>
      Please beware that all the information is provided by the service on "as-is" basis,
      without any guarantee of being correct, accurate or up-to-date.
    </p>

    <p>
      The information about third-party products and services including charts, price
      comparisons and estimates is provided based on our understanding of corresponding
      products and services and their pricing mechanisms.
    </p>

    <p>
      In no event shall we be liable for any loss suffered
      or incurred by you or any third party arising from the use or inability to use the
      information provided by the service, even if we or an authorized representative has been
      notified, orally or in writing, of the possibility of such damage.
    </p>
  </div>
);
