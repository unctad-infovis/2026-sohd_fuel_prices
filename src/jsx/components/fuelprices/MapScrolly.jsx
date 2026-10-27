import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { ChartMeta } from './ChartParts.jsx';
import { color, esc, fmtInt, isStill, svgFor, tipFor, tween, useFuelData } from './helpers.js';

const BINS = [
  { c: color('blue-light'), hi: 10, l: '<10%' },
  { c: color('blue'), hi: 20, l: '10% – 20%' },
  { c: color('yellow'), hi: 30, l: '20% – 30%' },
  { c: color('orange-brand'), hi: 40, l: '30% – 40%' },
  { c: color('red'), hi: Number.POSITIVE_INFINITY, l: '>40%' }
];
const NODATA = color('grey-light');
const FUEL_NAME = { d: 'diesel', g: 'gasoline' };

export default function MapScrolly() {
  const payload = useFuelData();
  const boxRef = useRef(null);
  const stickyRef = useRef(null);
  const chartRef = useRef(null);
  const legendRef = useRef(null);
  const captionFuelRef = useRef(null);
  const noteNRef = useRef(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!payload || !box) return undefined;
    const { data: DATA, map: MAP } = payload;
    const still = isStill();
    const byCode = {};
    for (const c of DATA.countries) if (c.c != null) byCode[c.c] = c;
    byCode[158] = byCode[156]; // Taiwan Province of China takes the colour of China (UN practice)
    const priceOf = (code, mode) => {
      const c = byCode[+code];
      return c ? (mode === 'g' ? c.g : c.d) : null;
    };
    const binColor = v => (v == null ? NODATA : BINS.find(b => v <= b.hi).c);
    const mapStats = mode => {
      const v = DATA.countries.map(c => (mode === 'g' ? c.g : c.d)).filter(z => z != null);
      return { hot: v.filter(z => z > 20).length, n: v.length };
    };

    const state = { mode: 'd', paths: [] };

    const makeMap = () => {
      const el = chartRef.current;
      const W = el.clientWidth || 860;
      const k = W / MAP.w;
      const H = Math.round(MAP.h * k);
      const svg = svgFor(el, W, H, 'World map of the change in local fuel prices since the start of the Middle East conflict').attr('class', 'hz_map_svg');
      const g = svg.append('g').attr('transform', `scale(${k})`);
      state.paths = Object.keys(MAP.eco).map(code => g.append('path').attr('class', 'hz_map_country').attr('data-code', code).attr('d', MAP.eco[code]).attr('vector-effect', 'non-scaling-stroke').style('fill', NODATA).node());
      for (const q of ['plain', 'dashed', 'dotted', 'dashdot']) if (MAP.borders[q]) g.append('path').attr('class', `hz_map_border hz_map_border--${q}`).attr('d', MAP.borders[q]).attr('vector-effect', 'non-scaling-stroke');
      const tip = tipFor(el);
      svg
        .on('mousemove', ev => {
          const p = ev.target.closest('path.hz_map_country');
          for (const q of state.paths) q.classList.toggle('is-hl', q === p);
          if (!p) {
            tip.classed('is-on', false);
            return;
          }
          const v = priceOf(p.dataset.code, state.mode);
          const name = MAP.names[p.dataset.code] || byCode[+p.dataset.code]?.n || '';
          const fuel = FUEL_NAME[state.mode];
          tip.html(`<b>${esc(name)}</b><div>${v == null ? 'No data' : `${fuel[0].toUpperCase() + fuel.slice(1)}: <b>${v > 0 ? '+' : ''}${v.toFixed(0)}%</b>`}</div>`).classed('is-on', true);
          const rr = el.getBoundingClientRect();
          tip.style('left', `${ev.clientX - rr.left}px`).style('top', `${ev.clientY - rr.top - 8}px`);
        })
        .on('mouseleave', () => {
          for (const q of state.paths) q.classList.remove('is-hl');
          tip.classed('is-on', false);
        });
      paint();
    };

    // Economies at or below +20% (and those without data) step back, so the map shows the number being read
    const paint = () => {
      for (const p of state.paths) {
        const v = priceOf(p.dataset.code, state.mode);
        p.style.fill = binColor(v);
        p.classList.toggle('is-low', v == null || v <= 20);
      }
    };

    const setMode = (mode, quiet) => {
      if (state.mode === mode && state.done) return;
      state.mode = mode;
      state.done = !quiet; // quiet: first paint at load, before the step is read
      const st = mapStats(mode);
      box.dataset.fuel = mode;
      box.classList.remove('is-focus');
      captionFuelRef.current.textContent = FUEL_NAME[mode];
      noteNRef.current.textContent = fmtInt(st.n);
      for (const s of box.querySelectorAll('.hz_maps_step')) s.classList.toggle('is-on', s.dataset.mode === mode);
      paint();
      if (quiet) return;
      clearTimeout(state.timer);
      state.timer = setTimeout(() => box.classList.add('is-focus'), still ? 0 : 700);
      // The big number counts up the first time its step is read
      const step = box.querySelector(`.hz_maps_step[data-mode="${mode}"]`);
      const cnt = step.querySelector('.hz_maps_count');
      if (!step.dataset.counted) {
        step.dataset.counted = 1;
        if (still) cnt.textContent = fmtInt(st.hot);
        else
          tween(
            1100,
            t => {
              cnt.textContent = fmtInt(Math.round(st.hot * d3.easeCubicOut(t)));
            },
            () => {
              cnt.textContent = fmtInt(st.hot);
            }
          );
      }
    };

    d3.select(legendRef.current)
      .selectAll('li')
      .data(BINS.map(b => [b.l, b.c]).concat([['No data', NODATA]]))
      .join('li')
      .attr('class', 'hz_classes_item')
      .html(d => `<span class="hz_classes_key" style="background:${d[1]}"></span>${d[0]}`);
    legendRef.current.querySelectorAll('.hz_classes_item').forEach((li, i) => {
      li.classList.toggle('is-low', i < 2 || i === BINS.length);
    });
    for (const s of box.querySelectorAll('.hz_maps_step')) s.querySelector('.hz_maps_count').textContent = fmtInt(mapStats(s.dataset.mode).hot);
    makeMap();
    setMode('d', true);

    // The fuel changes when the sentence of a step (not the whole step) reaches the middle of the screen
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) if (e.isIntersecting) setMode(e.target.closest('.hz_maps_step').dataset.mode);
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    for (const c of box.querySelectorAll('.hz_maps_title')) io.observe(c);
    // The steps take the real height of the map, so the texts sit level with it
    const ro = new ResizeObserver(() => box.style.setProperty('--hz-maps-h', `${stickyRef.current.offsetHeight}px`));
    ro.observe(stickyRef.current);

    let timer;
    let lastW = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(makeMap, 180);
    };
    window.addEventListener('resize', onResize);
    return () => {
      io.disconnect();
      ro.disconnect();
      clearTimeout(timer);
      clearTimeout(state.timer);
      window.removeEventListener('resize', onResize);
    };
  }, [payload]);

  return (
    <Block className="hz_block--map-scrolly" id="hz-maps" nav="At the pump">
      <div className="hz_maps" data-fuel="d" ref={boxRef}>
        <div className="hz_maps_steps">
          <div className="hz_maps_step" data-mode="d">
            <div className="hz_maps_card">
              <p className="hz_maps_fuel">
                <svg aria-hidden="true" className="hz_flip">
                  <use href="#ic-truck" />
                </svg>
                Diesel
              </p>
              <h3 className="hz_maps_title">
                <span className="hz_maps_big">
                  <span className="hz_maps_count" /> <span className="hz_maps_unit">countries</span>
                </span>{' '}
                experienced increases in local diesel prices by more than 20%.
              </h3>
            </div>
          </div>
          <div className="hz_maps_step" data-mode="g">
            <div className="hz_maps_card">
              <p className="hz_maps_fuel">
                <svg aria-hidden="true">
                  <use href="#ic-car" />
                </svg>
                Gasoline
              </p>
              <h3 className="hz_maps_title">
                <span className="hz_maps_big">
                  <span className="hz_maps_count" /> <span className="hz_maps_unit">countries</span>
                </span>{' '}
                experienced increases in local gasoline prices by more than 20%.
              </h3>
            </div>
          </div>
        </div>
        <div className="hz_maps_sticky" ref={stickyRef}>
          <p aria-live="polite" className="hz_maps_caption">
            Change in local retail prices of <span className="hz_maps_caption_fuel" ref={captionFuelRef} /> since the start of the Middle East conflict, in per cent
          </p>
          <ul className="hz_classes" ref={legendRef} />
          <figure className="hz_chart hz_map hz_maps_chart" ref={chartRef} />
        </div>
      </div>
      <ChartMeta
        note={
          <>
            Change of average local prices at the pump since the start of the Middle East conflict until 19 October 2026, compared to the six months before the conflict (weekly, 1 September 2025 – 23 February 2026). Computations for <span ref={noteNRef} /> economies, based on prices in local currencies.
          </>
        }
        source="UN Trade and Development (UNCTAD), based on Global Petrol Prices and national sources."
      >
        <p className="hz_meta_row hz_meta_row--disclaimer">
          The boundaries and names shown and the designations used on this map do not imply official endorsement or acceptance by the United Nations. Please see:{' '}
          <a href="https://unctad.org/map-disclaimer" rel="noopener" target="_blank">
            unctad.org/map-disclaimer
          </a>
        </p>
      </ChartMeta>
    </Block>
  );
}
