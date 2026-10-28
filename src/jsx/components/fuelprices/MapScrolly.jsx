import * as d3 from 'd3';
import { useEffect, useMemo, useRef, useState } from 'react';
import Block from './Block.jsx';
import { ChartMeta } from './ChartParts.jsx';
import FuelMap from './FuelMap.jsx';
import { fmtInt, isStill, tween, useFuelData, useTopology } from './helpers.js';
import MapFind from './MapFind.jsx';
import { mapClasses, THRESHOLD } from './mapClasses.js';

const FUEL_NAME = { d: 'diesel', g: 'gasoline' };

const statsFor = (rows, mode) => {
  const v = rows.map(r => r[mode]).filter(z => z != null);
  return { hot: v.filter(z => z > THRESHOLD).length, n: v.length };
};

export default function MapScrolly() {
  const payload = useFuelData();
  const topology = useTopology();
  const [mode, setMode] = useState('d');
  const [found, setFound] = useState(null);
  const boxRef = useRef(null);
  const stickyRef = useRef(null);
  const counted = useRef({});
  const legend = useMemo(() => mapClasses(), []);

  // Data keyed by the 3-digit economy code used by the UN map topology
  const rows = useMemo(() => payload?.data.countries.map(c => ({ code: String(c.c).padStart(3, '0'), d: c.d, g: c.g })), [payload]);
  const stats = useMemo(() => (rows ? { d: statsFor(rows, 'd'), g: statsFor(rows, 'g') } : null), [rows]);
  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    const box = boxRef.current;
    if (!stats || !box) return undefined;
    // The fuel changes when the sentence of a step (not the whole step) reaches the middle of the screen
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const step = e.target.closest('.maps_step');
          const m = step.dataset.mode;
          setMode(m);
          // The big number counts up the first time its step is read
          if (counted.current[m]) continue;
          counted.current[m] = true;
          const cnt = step.querySelector('.maps_count');
          const { hot } = statsRef.current[m];
          if (isStill()) cnt.textContent = fmtInt(hot);
          else
            tween(
              1100,
              t => {
                cnt.textContent = fmtInt(Math.round(hot * d3.easeCubicOut(t)));
              },
              () => {
                cnt.textContent = fmtInt(hot);
              }
            );
        }
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    for (const c of box.querySelectorAll('.maps_title')) io.observe(c);
    // The steps take the real height of the map, so the texts sit level with it
    const ro = new ResizeObserver(() => box.style.setProperty('--fp-maps-h', `${stickyRef.current.offsetHeight}px`));
    ro.observe(stickyRef.current);
    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, [stats]);

  const step = (m, icon, fuel, flip) => (
    <div className={`maps_step${mode === m ? ' is-on' : ''}`} data-mode={m}>
      <div className="maps_card">
        <p className="maps_fuel">
          <svg aria-hidden="true" className={flip ? 'flip' : undefined}>
            <use href={`#${icon}`} />
          </svg>
          {fuel}
        </p>
        <h3 className="maps_title">
          <span className="maps_big">
            <span className="maps_count">{stats ? fmtInt(stats[m].hot) : ''}</span> <span className="maps_unit">countries</span>
          </span>{' '}
          experienced increases in local <span className="maps_hl">{FUEL_NAME[m]}</span> prices by more than {THRESHOLD}%.
        </h3>
      </div>
    </div>
  );

  return (
    <Block className="block--map-scrolly" id="fp-maps">
      <div className="maps" ref={boxRef}>
        <div className="maps_steps">
          {step('d', 'ic-truck', 'Diesel', true)}
          {step('g', 'ic-car', 'Gasoline', false)}
        </div>
        <div className="maps_sticky" ref={stickyRef}>
          <p aria-live="polite" className="maps_caption">
            Change in local retail prices of <span className="maps_caption_fuel">{FUEL_NAME[mode]}</span> since the start of the Middle East conflict, in per cent
          </p>
          <ul className="classes">
            {legend.map(item => (
              <li className={`classes_item${item.low ? ' classes_item--low' : ''}`} key={item.label}>
                <span className="classes_key" style={{ background: item.color }} />
                {item.label}
              </li>
            ))}
            <li className="classes_item">
              <span className="classes_key classes_key--none" />
              No data
            </li>
          </ul>
          <figure className="chart map maps_chart">
            <FuelMap foundCode={found ? String(found.c).padStart(3, '0') : null} mode={mode} rows={rows} topology={topology} />
          </figure>
          {payload && <MapFind classes={legend} countries={payload.data.countries} found={found} onFound={setFound} />}
        </div>
      </div>
      <ChartMeta
        note={
          <>
            Change of average local prices at the pump since the start of the Middle East conflict until 19 October 2026, compared to the six months before the conflict (weekly, 1 September 2025 – 23 February 2026). Computations for {stats ? fmtInt(stats[mode].n) : ''} economies, based on prices in local currencies.{' '}
            <a href="https://unctad.org/map-disclaimer" rel="noopener" target="_blank">
              Map disclaimer
            </a>
            .
          </>
        }
        source="UN Trade and Development (UNCTAD), based on Global Petrol Prices and national sources."
      />
    </Block>
  );
}
