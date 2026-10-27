import * as d3 from 'd3';
import { useCallback, useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { drawAxis, drawGrid, onceVisible, svgFor, tween, useFuelData, useWidthRedraw } from './helpers.js';

const REGIONS = [
  { k: 'America', name: 'Latin America and the Caribbean', rot: [-64, -12] },
  { k: 'Africa', name: 'Africa', rot: [19, 2] },
  { k: 'Asia', name: 'Developing Asia and Oceania', rot: [104, 8] }
];

/* Orthographic globe drawn point by point: points on the far side are pulled onto the rim, so no ring can flip
   into a "whole sphere" fill (the simplified map has many tiny 3-point islands that defeat spherical clipping). */
function globePath(rings, lon0, lat0, c, R) {
  const D = Math.PI / 180;
  const sp = Math.sin(lat0 * D);
  const cp = Math.cos(lat0 * D);
  let d = '';
  for (const ring of rings) {
    let s = '';
    let vis = 0;
    for (const [i, p] of ring.entries()) {
      const lo = (p[0] - lon0) * D;
      const la = p[1] * D;
      const cl = Math.cos(la);
      const cosc = sp * Math.sin(la) + cp * cl * Math.cos(lo);
      let x = cl * Math.sin(lo);
      let y = cp * Math.sin(la) - sp * cl * Math.cos(lo);
      if (cosc < 0) {
        const nrm = Math.hypot(x, y) || 1;
        x /= nrm;
        y /= nrm;
      } else vis++;
      s += `${i ? 'L' : 'M'}${(c + R * x).toFixed(1)} ${(c - R * y).toFixed(1)}`;
    }
    if (vis) d += `${s}Z`;
  }
  return d;
}

/** One small line chart per region, under its globe: first and last values labelled, no tooltip. */
function regionChart(col, r, animate, f) {
  const el = col.select('.globe_chart').node();
  const T = f.t;
  const n = T.length;
  const v = f[r.k];
  const W = el.clientWidth || 260;
  const H = Math.max(230, Math.min(310, Math.round(W * 0.66)));
  const m = { b: 40, l: 34, r: 14, t: 16 };
  const x = d3.scaleUtc([Date.UTC(2024, 11, 20), Date.UTC(2026, 8, 10)], [m.l, W - m.r]);
  const y = d3.scaleLinear([0, 6.2], [H - m.b, m.t]);
  const svg = svgFor(el, W, H, `Inflation, ${r.name}: ${v[0].toFixed(1)}% in January 2025, ${v[n - 1].toFixed(1)}% in August 2026`);
  const s0 = T[T.findIndex(t => t >= Date.UTC(2026, 1, 1))];
  svg
    .append('rect')
    .attr('x', x(s0))
    .attr('y', m.t)
    .attr('width', x(T[n - 1]) - x(s0))
    .attr('height', H - m.t - m.b)
    .style('fill', 'url(#fp-hatch-yellow)');
  // The conflict label is only needed on the first chart
  if (r.k === REGIONS[0].k) {
    const sl = svg.append('text').attr('class', 'shade_label').attr('text-anchor', 'middle');
    for (const [j, l] of ['Middle East', 'conflict'].entries())
      sl.append('tspan')
        .attr('x', (x(s0) + x(T[n - 1])) / 2)
        .attr('y', H - m.b - 22 + j * 14)
        .text(l);
  }
  drawGrid(
    svg,
    y,
    W - m.r,
    [2, 4, 6].map(v => ({ label: v === 6 ? '6%' : v, v }))
  );
  drawAxis(
    svg,
    y(0),
    W - m.r,
    [
      [Date.UTC(2025, 0, 15), 'Jan', '2025'],
      [Date.UTC(2026, 1, 15), 'Feb', '2026'],
      [Date.UTC(2026, 7, 15), 'Aug']
    ].map(([t, label, year]) => ({ label, x: x(t), year }))
  );
  const path = svg
    .append('path')
    .attr('class', 'globe_line')
    .attr(
      'd',
      d3
        .line()
        .x((_, k) => x(T[k]))
        .y(z => y(z))(v)
    );
  const late = svg.append('g').attr('class', 'globe_late');
  late.append('circle').attr('class', 'globe_dot').attr('cx', x(T[0])).attr('cy', y(v[0])).attr('r', 4);
  late
    .append('text')
    .attr('class', 'globe_start')
    .attr('x', x(T[0]))
    .attr('y', y(v[0]) - 12)
    .attr('text-anchor', 'middle')
    .text(`${v[0].toFixed(1)}%`);
  late
    .append('circle')
    .attr('class', 'globe_dot')
    .attr('cx', x(T[n - 1]))
    .attr('cy', y(v[n - 1]))
    .attr('r', 4);
  // Latest value in a callout whose tip points at the last point of the line
  const ex = x(T[n - 1]);
  const ey = y(v[n - 1]);
  const bw = 60;
  const bh = 28;
  const tip = ey - 8;
  const base = tip - 8;
  const bx = Math.min(W - 2 - bw, ex - bw / 2);
  late
    .append('rect')
    .attr('class', 'globe_box')
    .attr('x', bx)
    .attr('y', base - bh)
    .attr('width', bw)
    .attr('height', bh)
    .attr('rx', 2);
  late
    .append('path')
    .attr('class', 'globe_box')
    .attr('d', `M${ex - 7},${base - 1}L${ex + 7},${base - 1}L${ex},${tip}Z`);
  late
    .append('text')
    .attr('class', 'globe_box_text')
    .attr('x', bx + bw / 2)
    .attr('y', base - bh / 2 + 5)
    .attr('text-anchor', 'middle')
    .text(`${v[n - 1].toFixed(1)}%`);
  if (!animate) {
    late.classed('is-on', true);
    return;
  }
  const L = path.node().getTotalLength();
  path.style('stroke-dasharray', L).style('stroke-dashoffset', L);
  tween(
    1800,
    t => path.style('stroke-dashoffset', L * (1 - d3.easeCubicInOut(t))),
    () => late.classed('is-on', true)
  );
}

export default function GlobeTrio() {
  const payload = useFuelData();
  const ref = useRef(null);
  const redrawRef = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!payload || !el) return undefined;
    const { data: DATA, globe: GLOBE } = payload;
    const codes = Object.keys(GLOBE.geo);
    const size = 230;
    const R = size / 2 - 3;
    const timers = [];
    const cols = d3
      .select(el)
      .html('')
      .selectAll('div.globe_col')
      .data(REGIONS)
      .join('div')
      .attr('class', r => `globe_col globe_col--${r.k}`);
    const globes = [];
    cols.each(function (r) {
      const col = d3.select(this);
      const svg = col.append('div').attr('class', 'globe').attr('aria-hidden', 'true').append('svg').attr('viewBox', `0 0 ${size} ${size}`);
      svg
        .append('circle')
        .attr('class', 'globe_ocean')
        .attr('cx', size / 2)
        .attr('cy', size / 2)
        .attr('r', R);
      const land = svg.append('g').selectAll('path').data(codes).join('path').attr('class', 'globe_land');
      svg
        .append('circle')
        .attr('class', 'globe_rim')
        .attr('cx', size / 2)
        .attr('cy', size / 2)
        .attr('r', R);
      col.append('h4').attr('class', 'globe_name').text(r.name);
      col.append('figure').attr('class', 'globe_chart');
      const g = { col, r, rot: [r.rot[0] - 140, r.rot[1]] };
      g.draw = ([lon, lat]) => {
        g.rot = [lon, lat];
        land.attr('d', code => globePath(GLOBE.geo[code], lon, lat, size / 2, R));
      };
      g.paint = on => land.classed('is-region', code => on && GLOBE.reg[code] === r.k);
      g.draw(g.rot);
      globes.push(g);
    });
    // On reveal the globes turn together, paint their region, then the three lines draw together
    const stop = onceVisible(
      el,
      instant => {
        for (const g of globes) {
          if (instant) {
            g.draw(g.r.rot);
            g.paint(true);
            regionChart(g.col, g.r, false, DATA.infl);
            continue;
          }
          const from = g.rot.slice();
          const to = g.r.rot;
          const dl = ((to[0] - from[0] + 540) % 360) - 180;
          tween(
            2000,
            t => {
              const e = d3.easeCubicInOut(t);
              g.draw([from[0] + dl * e, from[1] + (to[1] - from[1]) * e]);
            },
            () => {
              g.paint(true);
              timers.push(setTimeout(() => regionChart(g.col, g.r, true, DATA.infl), 350));
            }
          );
        }
      },
      0.3
    );

    // Charts that have already drawn are redrawn at the new width
    redrawRef.current = () => {
      for (const g of globes) if (g.col.select('svg[role=img]').size()) regionChart(g.col, g.r, false, DATA.infl);
    };
    return () => {
      stop();
      redrawRef.current = null;
      for (const t of timers) clearTimeout(t);
    };
  }, [payload]);
  const redraw = useCallback(() => redrawRef.current?.(), []);
  useWidthRedraw(redraw, !!payload);

  return (
    <Block id="fp-regions" nav="By region">
      <ChartHeader
        subtitle="Monthly year-on-year inflation rate in developing countries, median by region."
        title={
          <>
            The surge in inflation is particularly steep in <Accent yellow>developing Asia and Oceania</Accent>.
          </>
        }
      />
      <div className="globes globes--charts" ref={ref} />
      <ChartMeta note="The depicted data covers 91 developing countries (33 in Africa, 23 in Latin America and the Caribbean, 35 in Asia and Oceania) for which inflation data was available for August 2026." source="UN Trade and Development (UNCTAD), based on national sources and IMF retrieved from LSEG Datastream." />
    </Block>
  );
}
