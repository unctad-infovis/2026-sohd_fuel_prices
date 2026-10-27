import * as d3 from 'd3';
import { useCallback, useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { CONFLICT, drawAxis, drawGrid, onceVisible, svgFor, tween, useFuelData, useWidthRedraw } from './helpers.js';

const FUEL_DEF = [
  { icon: 'ic-ship', k: 'ship', name: 'Shipping fuel', pct: 72 },
  { icon: 'ic-truck', k: 'diesel', name: 'Diesel', pct: 81 },
  { icon: 'ic-car', k: 'gasoline', name: 'Gasoline', pct: 64 },
  { icon: 'ic-plane', k: 'jet', name: 'Jet fuel', pct: 80 }
];

export default function FuelsChart() {
  const payload = useFuelData();
  const wrapRef = useRef(null);
  const S = useRef({ armed: false, played: false });

  // Four small charts, one per fuel, same scale; each line draws itself left to right and the badge counts up
  const draw = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !payload) return;
    const FUELS = S.current;
    const f = payload.data.fuels;
    const T = f.t;
    const n = T.length;
    const units = FUEL_DEF;
    const minis = d3
      .select(wrap)
      .selectAll('div.mini')
      .data(units)
      .join(enter => {
        const d = enter.append('div').attr('class', 'mini');
        const h = d.append('div').attr('class', 'mini_head');
        h.append('div')
          .attr('class', 'mini_name')
          .html(u => `<svg aria-hidden="true"><use href="#${u.icon}"/></svg><span>${u.name}</span>`);
        h.append('div')
          .attr('class', 'mini_pct')
          .text(u => (FUELS.played ? `+${u.pct}%` : '+0%'));
        d.append('figure').attr('class', 'mini_chart');
        return d;
      });
    minis.each(function (u, i) {
      const el = d3.select(this).select('.mini_chart').node();
      const W = el.clientWidth || 200;
      const H = Math.max(200, Math.min(260, Math.round(W * 0.95))) + 16; // Room for the two-line x-axis labels
      const m = { b: 46, l: 30, r: 8, t: 14 }; // Left margin keeps the line clear of the y-axis labels
      const x = d3.scaleUtc([T[0], T[n - 1]], [m.l, W - m.r]);
      const y = d3.scaleLinear([0, 290], [H - m.b, m.t]);
      const svg = svgFor(el, W, H, `${u.name} price index, +${u.pct}% since the start of the Middle East conflict`);
      const cid = `fp-fuel-clip-${u.k}`;
      const clip = svg
        .append('defs')
        .append('clipPath')
        .attr('id', cid)
        .append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('height', H)
        .attr('width', FUELS.played ? W : 0);
      svg
        .append('rect')
        .attr('x', x(CONFLICT))
        .attr('y', m.t)
        .attr('width', x(T[n - 1]) - x(CONFLICT))
        .attr('height', H - m.t - m.b)
        .style('fill', 'url(#fp-hatch-yellow)');
      // The conflict label is only needed on the first chart
      if (i === 0) {
        const sl = svg.append('text').attr('class', 'shade_label').attr('text-anchor', 'middle');
        for (const [j, l] of ['Middle East', 'conflict'].entries())
          sl.append('tspan')
            .attr('x', (x(CONFLICT) + x(T[n - 1])) / 2)
            .attr('y', H - m.b - 22 + j * 14)
            .text(l);
      }
      drawGrid(svg, y, W - m.r, [{ v: 100 }, { v: 200 }]);
      drawAxis(
        svg,
        y(0),
        W - m.r,
        [2024, 2025, 2026].map(yr => ({ label: 'Sep', x: x(Date.UTC(yr, 8, 1)), year: yr })).filter(t => t.x >= m.l - 1 && t.x <= W - m.r + 1)
      );
      svg
        .append('path')
        .attr('class', 'mini_line')
        .attr('clip-path', `url(#${cid})`)
        .attr(
          'd',
          d3
            .line()
            .x((_, k) => x(T[k]))
            .y(v => y(v))(f[u.k])
        );
      u.clip = clip;
      u.W = W;
    });
    if (FUELS.played || FUELS.armed) return;
    FUELS.armed = true;
    onceVisible(
      wrap,
      instant => {
        FUELS.played = true;
        minis.each(function (u, i) {
          const pct = d3.select(this).select('.mini_pct');
          if (instant) {
            u.clip.attr('width', u.W);
            pct.text(`+${u.pct}%`);
            return;
          }
          tween(
            2200,
            t => {
              const e = d3.easeCubicInOut(t);
              u.clip.attr('width', u.W * e);
              pct.text(`+${Math.round(u.pct * Math.max(0, (e - 0.55) / 0.45))}%`);
            },
            () => pct.text(`+${u.pct}%`),
            i * 250
          );
        });
      },
      0.25
    );
  }, [payload]);

  useEffect(() => {
    draw();
  }, [draw]);
  useWidthRedraw(draw, !!payload);

  return (
    <Block id="fp-fuels" nav="Fuels">
      <ChartHeader
        subtitle="Index: average for the period 1 Sep 2025 – 27 Feb 2026 = 100."
        title={
          <>
            Fuels propelling global production and trade have gotten <Accent>more expensive</Accent>.
          </>
        }
      />
      <div className="chart minis" ref={wrapRef} />
      <ChartMeta
        note="Increase of prices since the start of the Middle East conflict until 20 October 2026 compared to the six months before (1 September 2025 – 27 February 2026). Shipping fuel is an average of low- and high-sulphur bunker fuel prices in Singapore; diesel includes ultra-low sulphur diesel (10ppm) for Northern America and Europe and gas oil (50ppm) for Asia; gasoline is regular unleaded gasoline."
        source="UN Trade and Development (UNCTAD), based on Clarksons Research Shipping Intelligence Network, LSEG Datastream and International Air Transport Association (IATA) using data from S&P Global Energy."
      />
    </Block>
  );
}
