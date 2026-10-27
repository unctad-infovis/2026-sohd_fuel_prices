import * as d3 from 'd3';
import { useCallback, useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { CONFLICT, onceVisible, svgFor, tween, useFuelData, useWidthRedraw } from './helpers.js';

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
      .selectAll('div.hz_mini')
      .data(units)
      .join(enter => {
        const d = enter.append('div').attr('class', 'hz_mini');
        const h = d.append('div').attr('class', 'hz_mini_head');
        h.append('div')
          .attr('class', 'hz_mini_name')
          .html(u => `<svg aria-hidden="true"><use href="#${u.icon}"/></svg><span>${u.name}</span>`);
        h.append('div')
          .attr('class', 'hz_mini_pct')
          .text(u => (FUELS.played ? `+${u.pct}%` : '+0%'));
        d.append('figure').attr('class', 'hz_mini_chart');
        return d;
      });
    minis.each(function (u, i) {
      const el = d3.select(this).select('.hz_mini_chart').node();
      const W = el.clientWidth || 200;
      const H = Math.max(200, Math.min(260, Math.round(W * 0.95))) + 16; // Room for the two-line x-axis labels
      const m = { b: 46, l: 30, r: 8, t: 14 }; // Left margin keeps the line clear of the y-axis labels
      const x = d3.scaleUtc([T[0], T[n - 1]], [m.l, W - m.r]);
      const y = d3.scaleLinear([0, 290], [H - m.b, m.t]);
      const svg = svgFor(el, W, H, `${u.name} price index, +${u.pct}% since the start of the Middle East conflict`);
      const cid = `hz-fuel-clip-${u.k}`;
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
        .style('fill', 'url(#hz-hatch-yellow)');
      // The conflict label is only needed on the first chart
      if (i === 0) {
        const sl = svg.append('text').attr('class', 'hz_shade_label').attr('text-anchor', 'middle');
        for (const [j, l] of ['Middle East', 'conflict'].entries())
          sl.append('tspan')
            .attr('x', (x(CONFLICT) + x(T[n - 1])) / 2)
            .attr('y', H - m.b - 22 + j * 14)
            .text(l);
      }
      const grid = svg.append('g').attr('class', 'hz_grid');
      for (const v of [100, 200]) {
        grid
          .append('line')
          .attr('x1', 0)
          .attr('x2', W - m.r)
          .attr('y1', y(v))
          .attr('y2', y(v));
        grid
          .append('text')
          .attr('x', 0)
          .attr('y', y(v) - 6)
          .text(v);
      }
      const ax = svg.append('g').attr('class', 'hz_axis');
      ax.append('line')
        .attr('class', 'hz_axis_base')
        .attr('x1', 0)
        .attr('x2', W - m.r)
        .attr('y1', y(0))
        .attr('y2', y(0));
      for (const yr of [2024, 2025, 2026]) {
        const xx = x(Date.UTC(yr, 8, 1));
        if (xx < m.l - 1 || xx > W - m.r + 1) continue;
        ax.append('line')
          .attr('class', 'hz_axis_tick')
          .attr('x1', xx)
          .attr('x2', xx)
          .attr('y1', y(0))
          .attr('y2', y(0) + 5);
        ax.append('text')
          .attr('x', xx)
          .attr('y', y(0) + 20)
          .attr('text-anchor', 'middle')
          .text('Sep');
        ax.append('text')
          .attr('class', 'hz_axis_year')
          .attr('x', xx)
          .attr('y', y(0) + 36)
          .attr('text-anchor', 'middle')
          .text(yr);
      }
      svg
        .append('path')
        .attr('class', 'hz_mini_line')
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
          const pct = d3.select(this).select('.hz_mini_pct');
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
    <Block id="hz-fuels" nav="Fuels">
      <ChartHeader
        subtitle="Index: average for the period 1 Sep 2025 – 27 Feb 2026 = 100."
        title={
          <>
            Fuels propelling global production and trade have gotten <Accent>more expensive</Accent>.
          </>
        }
      />
      <div className="hz_chart hz_minis" ref={wrapRef} />
      <ChartMeta
        note="Increase of prices since the start of the Middle East conflict until 20 October 2026 compared to the six months before (1 September 2025 – 27 February 2026). Shipping fuel is an average of low- and high-sulphur bunker fuel prices in Singapore; diesel includes ultra-low sulphur diesel (10ppm) for Northern America and Europe and gas oil (50ppm) for Asia; gasoline is regular unleaded gasoline."
        source="UN Trade and Development (UNCTAD), based on Clarksons Research Shipping Intelligence Network, LSEG Datastream and International Air Transport Association (IATA) using data from S&P Global Energy."
      />
    </Block>
  );
}
