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

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import * as c from './Controls';
import {
  ganalytics,
  LANDING_PRICE_CHART_MONTH_12,
  LANDING_PRICE_CHART_MONTH_24,
  LANDING_PRICE_CHART_MONTH_60,
  LANDNIG_PRICE_CHART_MONTH_120,
  LANDING_PRICE_CHART_STORAGE_1,
  LANDING_PRICE_CHART_STORAGE_2,
  LANDING_PRICE_CHART_STORAGE_5,
  LANDING_PRICE_CHART_STORAGE_10
} from '../library/GentaAnalytics.js';

const config_wide = {
  type: 'line',
  data: null,
  options: {
    scales: {
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.75)', },
        title: {
          display: true,
          text: 'Cost, USD',
          color: 'rgba(255, 255, 255, 0.75)',
          font: {
            size: 20,
            weight: 'bold',
            lineHeight: 2,
          },
        },
      },
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.75)', },
        title: {
          display: true,
          text: 'Time, Months',
          color: 'rgba(255, 255, 255, 0.75)',
          font: {
            size: 20,
            weight: 'bold',
            lineHeight: 2,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  },
};

const config_narrow = {
  type: 'bar',
  data: null,
  options: {
    scales: {
      y: {
        display: false,
        grid: {
          display: false,
        },
        beginAtZero: true,
        ticks: {
          max: 500,
          color: 'rgba(255, 255, 255, 0.75)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.75)',
        },
      },
    },

    plugins: {
      legend: {
        display: false,
      },
    },

  },
};

function calculateStorageCost(
  target_config,
  is_wide,
  monthly_allocation /* 1,2,5,10 */,
  num_months /* 15, 30, 60, 120 */,
  setGoogleCost,
  setAppleCost,
  setGentaCost
) {
  if (is_wide) {
    // eslint-disable-next-line no-param-reassign
    target_config.data = {
      labels: [...Array(num_months).keys()].map(v => `${v}`),
      datasets: [],
    };
  } else {
    // eslint-disable-next-line no-param-reassign
    target_config.data = {
      labels: ['Genta.app', 'Google Drive', 'Apple iCloud'],
      datasets: [{
        data: null,
        backgroundColor: [
          'rgb(99, 255, 132)', 'rgb(132, 99, 255)', 'rgb(255, 99, 132)',
        ],
        borderColor: [
          'rgb(99, 255, 132)', 'rgb(132, 99, 255)', 'rgb(255, 99, 132)',
        ],
        borderWidth: 1,
      }],
    };
  }


  // per month, in USD
  const apple_monthly_pricing = [
    { size: 50, price: 0.99 },
    { size: 200, price: 2.99 },
    { size: 2000, price: 9.99 },
  ];

  const google_monthly_pricing = [
    { size: 15, price: 0 },
    { size: 100, price: 1.99 },
    { size: 200, price: 2.99 },
    { size: 2000, price: 9.99 },
    { size: 10000, price: 49.99 },
    { size: 20000, price: 99 },
    { size: 30000, price: 149 },
  ];

  /*
  dropbox:
  Thank you for patiently waiting! The charges in USD are as follows:
  its $11.99 for a month, and annually its $9.99 per month, and for
  12 months it's $119.88.
  */

  // const dropbox_monthly_pricing = [
  //   { size: 2000, price: 11.99 },
  // ];

  const buildLadderCostTable = (start_size, end_size, monthly_pricing) => {
    const t = [];

    let index = 0;
    let acc_cost = 0;

    for (let allocated = start_size + monthly_allocation; allocated <= end_size;
      allocated += monthly_allocation) {
      while (monthly_pricing[index].size < allocated) {
        index += 1;
      }

      acc_cost += monthly_pricing[index].price;
      t.push({ cost: acc_cost, alloc: allocated });
    }

    return t;
  };

  const buildProgressiveCostTable = (start_size, end_size, free_storage, monthly_pricing) => {
    const t = [];

    const fixed_cost = 0.99; // this is what we charge per month
    let acc_cost = 0;

    for (let allocated = start_size + monthly_allocation; allocated <= end_size;
      allocated += monthly_allocation) {
      acc_cost += fixed_cost + (Math.max(allocated - free_storage, 0) / 1000 * monthly_pricing);
      t.push({ cost: acc_cost, alloc: allocated });
    }

    return t;
  };

  const google_table = buildLadderCostTable(
    0, num_months * monthly_allocation, google_monthly_pricing
  );
  const apple_table = buildLadderCostTable(
    0, num_months * monthly_allocation, apple_monthly_pricing
  );
  // const dropbox_table =
  //     buildLadderCostTable(0, num_months*monthly_allocation, dropbox_monthly_pricing);
  const genta_table = buildProgressiveCostTable(
    0, num_months * monthly_allocation, 15 /* free storage GB */, 5 /* B2 cost per TB */
  );

  if (is_wide) {
    target_config.data.datasets.push({
      label: 'Genta.app',
      data: genta_table.map(v => v.cost),
      backgroundColor: 'rgb(99, 255, 132)',
      borderColor: 'rgb(99, 255, 132)',
      borderWidth: 5,
      pointRadius: 0,
    });

    target_config.data.datasets.push({
      label: 'Google Drive',
      data: google_table.map(v => v.cost),
      backgroundColor: 'rgb(132, 99, 255)',
      borderColor: 'rgb(132, 99, 255)',
      borderWidth: 5,
      pointStyle: null,
      pointRadius: 0,
    });

    target_config.data.datasets.push({
      label: 'Apple iCloud',
      data: apple_table.map(v => v.cost),
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: 'rgb(255, 99, 132)',
      borderWidth: 5,
      pointRadius: 0,
    });

    // data.datasets.push({
    //   label: "Dropbox Plus",
    //   data: dropbox_table.map(v => v.cost),
    //   backgroundColor: 'rgb(132, 99, 132)',
    //   borderColor: 'rgb(132, 99, 132)',
    // });
  } else {
    // eslint-disable-next-line no-param-reassign
    target_config.data.datasets[0].data = [
      genta_table[num_months - 1].cost,
      google_table[num_months - 1].cost,
      apple_table[num_months - 1].cost,
    ];
  }

  setGoogleCost(google_table[num_months - 1]);
  setAppleCost(apple_table[num_months - 1]);
  setGentaCost(genta_table[num_months - 1]);
}


export const PriceChartComponent = () => {
  const [chart, setChart] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [increment, setIncrement] = useState(5);
  const [timespan, setTimespan] = useState(60);
  const [google_cost, setGoogleCost] = useState(0);
  const [apple_cost, setAppleCost] = useState(0);
  const [genta_cost, setGentaCost] = useState(0);

  useEffect(() => {
    if (loaded) {
      return;
    }

    const script = document.createElement('script');
    script.src = '/js/chart.42c91fe9.js';
    script.async = true;
    script.crossorigin = 'anonymous';

    const use_wide_config = document.getElementsByClassName('price-chart-wide')[0].clientHeight > 0;

    calculateStorageCost(
      use_wide_config ? config_wide : config_narrow,
      use_wide_config,
      increment,
      timespan,
      setGoogleCost,
      setAppleCost,
      setGentaCost
    );

    let ch;

    script.addEventListener('load', () => {
      if (use_wide_config) {
        ch = new window.Chart(
          document.getElementById('chart-wide'),
          config_wide
        );
      } else {
        ch = new window.Chart(
          document.getElementById('chart-narrow'),
          config_narrow
        );
      }

      setChart(ch);
    });

    document.body.appendChild(script);
    setLoaded(true);
  });

  const handleSetStorageIncrement = (new_increment) => {
    const use_wide_config = document.getElementsByClassName('price-chart-wide')[0].clientHeight > 0;

    calculateStorageCost(
      use_wide_config ? config_wide : config_narrow,
      use_wide_config,
      new_increment,
      timespan,
      setGoogleCost,
      setAppleCost,
      setGentaCost
    );

    chart.update();
    setIncrement(new_increment);
  };

  const handleSetTimespan = (new_timespan) => {
    const use_wide_config = document.getElementsByClassName('price-chart-wide')[0].clientHeight > 0;

    calculateStorageCost(
      use_wide_config ? config_wide : config_narrow,
      use_wide_config,
      increment,
      new_timespan,
      setGoogleCost,
      setAppleCost,
      setGentaCost,
    );
    chart.update();
    setTimespan(new_timespan);
  };

  return (
    <div style={{
      width: '90%', margin: '1rem auto 5rem', padding: '5rem 0', backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }}
    >
      <div style={{ width: 'min(60rem, 90%)', margin: '0 auto' }}>

        <div className="price-chart-wide">
          <h1 style={{ display: 'flex', justifyContent: 'center', fontSize: '1.5rem' }}>Storage Cost Calculator</h1>

          <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontWeight: 'bold', marginRight: '2rem' }}>Monthly Uploaded Data</span>
            <c.Checkbox
              checked={increment === 1}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_1);
                handleSetStorageIncrement(1);
              }}
            >
              +1 GB
            </c.Checkbox>
            <c.Checkbox
              checked={increment === 2}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_2);
                handleSetStorageIncrement(2);
              }}
            >
              +2 GB
            </c.Checkbox>
            <c.Checkbox
              checked={increment === 5}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_5);
                handleSetStorageIncrement(5);
              }}
            >
              +5 GB
            </c.Checkbox>
            <c.Checkbox
              checked={increment === 10}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_10);
                handleSetStorageIncrement(10);
              }}
            >
              +10 GB
            </c.Checkbox>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
            <span style={{ fontWeight: 'bold', marginRight: '2rem' }}>Time Span</span>
            <c.Checkbox
              checked={timespan === 12}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_MONTH_12);
                handleSetTimespan(12);
              }}
            >
              12 Months
            </c.Checkbox>
            <c.Checkbox
              checked={timespan === 24}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_MONTH_24);
                handleSetTimespan(24);
              }}
            >
              24 Months
            </c.Checkbox>
            <c.Checkbox
              checked={timespan === 60}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_MONTH_60);
                handleSetTimespan(60);
              }}
            >
              60 Months
            </c.Checkbox>
            <c.Checkbox
              checked={timespan === 120}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDNIG_PRICE_CHART_MONTH_120);
                handleSetTimespan(120);
              }}
            >
              120 Months
            </c.Checkbox>
          </div>

          <canvas id="chart-wide" style={{ marginTop: '4rem' }} />

          <div style={{ display: 'flex', justifyContent: 'center', margin: '3rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 5rem 1rem', gap: '0.5rem 1rem' }}>
              <div style={{ textAlign: 'right' }}>
                Total Used Storage after {timespan} Months
              </div>
              <div>
                {google_cost.alloc} GB
              </div>
              <div />

              <div style={{ textAlign: 'right', marginTop: '1rem' }}>
                Total Cost after {timespan} Months
              </div>
              <div />
              <div />

              <div style={{ textAlign: 'right' }}>Google Drive</div>
              <div>
                US $
                {Math.round(google_cost.cost)}
              </div>
              <div style={{
                backgroundColor: 'rgb(132, 99, 255)', width: '100%', height: '0.5rem', margin: '0.25rem 0',
              }}
              />

              <div style={{ textAlign: 'right' }}>Apple iCloud</div>
              <div>
                US $
                {Math.round(apple_cost.cost)}
              </div>
              <div style={{
                backgroundColor: 'rgb(255, 99, 132)', width: '100%', height: '0.5rem', margin: '0.25rem 0'
              }}
              />

              <div style={{ textAlign: 'right' }}>Genta.app + Backblaze B2</div>
              <div>
                US $
                {Math.round(genta_cost.cost)}
              </div>
              <div style={{
                backgroundColor: 'rgb(99, 255, 132)', width: '100%', height: '0.5rem', margin: '0.25rem 0'
              }}
              />
            </div>
          </div>
        </div>

        <div className="price-chart-narrow">
          <h1 style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>Storage Cost Calculator</h1>

          <canvas id="chart-narrow" style={{ display: 'none' }} />
          <div style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem' }}>Monthly Uploaded Data, GB</div>

          <div className="price-chart-checkbox-list-narrow">

            <div>+1</div>
            <div>+2</div>
            <div>+5</div>
            <div>+10</div>

            <c.Checkbox
              checked={increment === 1}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_1);
                handleSetStorageIncrement(1);
              }}
            />
            <c.Checkbox
              checked={increment === 2}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_2);
                handleSetStorageIncrement(2);
              }}
            />
            <c.Checkbox
              checked={increment === 5}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_5);
                handleSetStorageIncrement(5);
              }}
            />
            <c.Checkbox
              checked={increment === 10}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_STORAGE_10);
                handleSetStorageIncrement(10);
              }}
            />
          </div>

          <div style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem' }}>Time Span, Months</div>

          <div className="price-chart-checkbox-list-narrow">
            <div>12</div>
            <div>24</div>
            <div>60</div>
            <div>120</div>
            <c.Checkbox
              checked={timespan === 12}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_MONTH_12);
                handleSetTimespan(12);
              }}
            />
            <c.Checkbox
              checked={timespan === 24}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_MONTH_24);
                handleSetTimespan(24);
              }}
            />
            <c.Checkbox
              checked={timespan === 60}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDING_PRICE_CHART_MONTH_60);
                handleSetTimespan(60);
              }}
            />
            <c.Checkbox
              checked={timespan === 120}
              className="custom-checkbox1"
              onClick={() => {
                ganalytics.track(LANDNIG_PRICE_CHART_MONTH_120);
                handleSetTimespan(120);
              }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', margin: '1rem 0 0.5rem' }}>Total Used Storage</div>
            <div style={{ textAlign: 'right' }}>
              {google_cost.alloc}
              {' '}
              GB
            </div>
          </div>
          <div style={{ fontWeight: 'bold', margin: '1rem 0 1rem' }}>Total Cost, USD</div>
          <div style={{ display: 'flex', marginBottom: '0.5rem', justifyContent: 'space-between' }}>
            <div>Google Drive</div>
            <div>
              $
              {Math.round(google_cost.cost)}
            </div>
          </div>
          <div style={{ display: 'flex', marginBottom: '0.5rem', justifyContent: 'space-between' }}>
            <div>Apple iCloud</div>
            <div>
              $
              {Math.round(apple_cost.cost)}
            </div>
          </div>
          <div style={{ display: 'flex', marginBottom: '0.5rem', justifyContent: 'space-between' }}>
            <div>Genta.app + B2</div>
            <div>
              $
              {Math.round(genta_cost.cost)}
            </div>
          </div>

        </div>

        <div style={{ fontSize: '0.92rem', marginTop: '4rem', textAlign: 'center' }}>
          This information is a subject to our
          {' '}
          <Link to="/doc/information-policy">Information Policy</Link>
        </div>

      </div>
    </div>
  );
};
