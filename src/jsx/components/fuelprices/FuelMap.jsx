import createMaplineSeries from '@unctad-infovis/map-tools/CreateMaplineSeries.js';
import getColor from '@unctad-infovis/map-tools/GetColor.js';
import processTopoObject from '@unctad-infovis/map-tools/ProcessTopoObject.js';
import processTopoObjectPolygons from '@unctad-infovis/map-tools/ProcessTopoObjectPolygons.js';
import Highcharts from 'highcharts';
// https://www.highcharts.com/
import 'highcharts/modules/accessibility';
import 'highcharts/modules/map';
import 'highcharts/modules/pattern-fill';
import { useEffect, useRef } from 'react';
import { tokenColor } from './helpers.js';
import { mapClasses, noDataStripe, THRESHOLD } from './mapClasses.js';

// Economies whose boundaries borrow China's data (Macao, Hong Kong, China, Taiwan), as in every UNCTAD map using this topology
const CHINA_AREAS = ['156', '158', '344', '446'];
// Disputed territories that show the data of the economy they are treated as part of
const BORROWS = { 156: '156', 158: '156', 344: '156', 412: '688', 446: '156', C00003: '356' };
const FUEL_NAME = { d: 'Diesel', g: 'Gasoline' };

/** Hover or release the hover state of every other area of China, so China, Taiwan, Hong Kong and Macao light up together. */
function setChinaHover(point, state) {
  if (!CHINA_AREAS.includes(point.options.code)) return;
  for (const p of point.series.points) {
    if (p !== point && CHINA_AREAS.includes(p.options.code)) p.setState(state);
  }
}

/** Hatched fill for economies without data, so it can never be mistaken for a data class. */
const noDataFill = () => ({
  pattern: {
    backgroundColor: '#fff',
    color: noDataStripe(),
    height: 6,
    path: { d: 'M 0 6 L 6 0 M -1 1 L 1 -1 M 5 7 L 7 5', strokeWidth: 1 },
    width: 6
  }
});

/** UN map of the change in local fuel prices, coloured by class (blues up to the threshold, reds above it). */
export default function FuelMap({ foundCode, mode, rows, topology }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const dataRef = useRef(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const foundRef = useRef(foundCode);
  foundRef.current = foundCode;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !rows || !topology) return undefined;
    const classes = mapClasses();
    const hatch = noDataFill();
    const colorFromValue = value => (value == null ? hatch : classes.find(c => value <= c.hi).fill);
    const rowsFor = m => rows.map(r => ({ code: r.code, value: r[m] }));
    const seriesData = m => {
      const data = rowsFor(m);
      return topology.objects.economies.geometries.map(region => {
        const { code, labelen } = region.properties;
        const own = data.find(row => row.code === code);
        const source = data.find(row => row.code === (BORROWS[code] || code));
        // getColor reads the economy's own value from its properties
        region.properties.value = own ? own.value : null;
        const isFound = code === foundRef.current;
        return {
          borderColor: '#fff',
          borderWidth: isFound ? 1.8 : 0,
          code,
          color: getColor(region.properties, data, CHINA_AREAS, colorFromValue),
          id: code,
          // The data is for all of China, so every area shows the same name
          name: CHINA_AREAS.includes(code) ? 'China' : labelen,
          // 0 is a real value, so no `||` fallback
          value: code === 'C00002' ? null : (source?.value ?? null)
        };
      });
    };
    dataRef.current = seriesData;
    Highcharts.setOptions({ lang: { decimalPoint: '.', thousandsSep: ' ' } });
    chartRef.current = Highcharts.mapChart(el, {
      accessibility: { description: `World map of the change in local retail fuel prices since the start of the Middle East conflict. Economies with an increase of more than ${THRESHOLD}% are shown in red.` },
      chart: { backgroundColor: 'transparent', height: '46%', style: { fontFamily: 'Inter, Helvetica, Arial, sans-serif' }, type: 'map' },
      credits: { enabled: false },
      exporting: { enabled: false },
      legend: { enabled: false },
      mapNavigation: { enabled: false },
      plotOptions: { mapline: { lineWidth: 0.33, tooltip: { enabled: false } } },
      series: [
        {
          affectsMapView: true,
          data: seriesData(modeRef.current),
          enableMouseTracking: true,
          joinBy: ['code', 'code'],
          mapData: processTopoObjectPolygons(topology, 'economies-color'),
          name: 'economies_color',
          nullColor: tokenColor('grey-light'),
          point: {
            events: {
              mouseOut() {
                setChinaHover(this, '');
              },
              mouseOver() {
                setChinaHover(this, 'hover');
              }
            }
          },
          states: { hover: { borderColor: '#fff', borderWidth: 1.8 }, inactive: { enabled: false } },
          type: 'map'
        },
        createMaplineSeries('dash_borders', processTopoObject(topology, 'dashed-borders'), 'Dash'),
        createMaplineSeries('dot_borders', processTopoObject(topology, 'dotted-borders'), 'Dot'),
        createMaplineSeries('dash_dot_borders', processTopoObject(topology, 'plain-borders'), 'DashDot'),
        createMaplineSeries('solid_borders', processTopoObject(topology, 'plain-borders'), 'Solid')
      ],
      subtitle: { text: null },
      title: { text: null },
      tooltip: {
        backgroundColor: '#fff',
        borderColor: tokenColor('grey-light'),
        borderRadius: 3,
        formatter() {
          const { name, value } = this.point;
          const text = value == null ? 'No data' : `${FUEL_NAME[modeRef.current]}: <b>${value > 0 ? '+' : ''}${value.toFixed(0)}%</b>`;
          return `<b>${name}</b><br />${text}`;
        },
        style: { color: tokenColor('grey-darkest'), fontSize: '13px', fontWeight: 300 },
        useHTML: true
      }
    });
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
      dataRef.current = null;
    };
  }, [rows, topology]);

  // Switching fuel only re-colours the economies; the economy found by the search gets an outline and is drawn above its neighbours
  useEffect(() => {
    const series = chartRef.current?.series[0];
    if (!series || !dataRef.current) return;
    series.setData(dataRef.current(mode), true, false);
    if (foundCode) series.points.find(p => p.options.code === foundCode)?.graphic?.toFront();
  }, [mode, foundCode]);

  return <div ref={containerRef} />;
}
