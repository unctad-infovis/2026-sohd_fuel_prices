import * as d3 from 'd3';
import { useCallback, useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { onceVisible, tween, useFuelData, useWidthRedraw } from './helpers.js';

export default function TagsChart() {
  const payload = useFuelData();
  const chartRef = useRef(null);
  const S = useRef({ armed: false, played: false });

  const draw = useCallback(() => {
    const el = chartRef.current;
    if (!el || !payload) return;
    const TAGS = S.current;
    const p = payload.data.col['Poorest households'];
    const W = el.clientWidth || 900;
    const narrow = W < 600;
    const k = narrow ? 1.75 : 1;
    const items = [
      { cls: 'adv', l: ['Advanced', 'economies'], v: p.adv, x: 258 },
      { cls: 'dev', l: ['Developing', 'countries'], v: p.dev, x: 579 },
      { cls: 'low', l: ['Low-income', 'developing countries'], v: p.lidc, x: 920 }
    ];
    const RY = 463;
    const AP = 517;
    const x0 = 92;
    const x1 = 1107;
    const L = x1 - x0;
    const svg = d3
      .select(el)
      .html('')
      .append('svg')
      .attr('class', 'tags')
      .attr('viewBox', `80 ${narrow ? 348 : 390} 1040 ${narrow ? 492 : 450}`)
      .attr('role', 'img')
      .attr('aria-label', `Additional inflation faced by the poorest households: advanced economies ${p.adv} points, developing countries ${p.dev} points, low-income developing countries ${p.lidc} points`);
    for (const [i, it] of items.entries()) {
      const fs = 22 * k;
      const t = svg
        .append('text')
        .attr('class', 'tags_group')
        .attr('text-anchor', 'middle')
        .attr('font-size', fs)
        .style('transition-delay', `${0.1 + i * 0.12}s`);
      t.append('tspan')
        .attr('x', it.x)
        .attr('y', RY - 18 - fs * 1.1)
        .text(it.l[0]);
      t.append('tspan')
        .attr('x', it.x)
        .attr('dy', fs * 1.18)
        .text(it.l[1]);
    }
    svg.append('line').attr('class', 'tags_rail').attr('x1', x0).attr('y1', RY).attr('x2', x1).attr('y2', RY).attr('stroke-dasharray', L).attr('stroke-dashoffset', L).style('transition-delay', '.35s');
    svg.append('circle').attr('class', 'tags_end').attr('cx', x0).attr('cy', RY).attr('r', 9).style('transition-delay', '.4s');
    svg.append('circle').attr('class', 'tags_end').attr('cx', x1).attr('cy', RY).attr('r', 9).style('transition-delay', '1.25s');
    for (const [i, it] of items.entries()) {
      const r = Math.sqrt(it.v);
      const w = 131 * r;
      const h = 147 * r;
      const sh = 0.235 * h;
      const cx = it.x;
      const hy = AP + 40;
      const d0 = 1.35 + i * 0.55;
      const sl = Math.hypot(16, hy - RY);
      for (const dx of [-16, 16])
        svg
          .append('line')
          .attr('class', 'tags_string')
          .attr('x1', cx + dx)
          .attr('y1', RY)
          .attr('x2', cx)
          .attr('y2', hy)
          .attr('stroke-dasharray', sl)
          .attr('stroke-dashoffset', sl)
          .style('transition-delay', `${d0}s`);
      const R = 9;
      const xl = cx - w / 2;
      const xr = cx + w / 2;
      const yb = AP + h;
      const shape = `M${cx} ${AP} L${xr - 4} ${AP + sh - 4} Q${xr} ${AP + sh} ${xr} ${AP + sh + 6} L${xr} ${yb - R} Q${xr} ${yb} ${xr - R} ${yb} L${xl + R} ${yb} Q${xl} ${yb} ${xl} ${yb - R} L${xl} ${AP + sh + 6} Q${xl} ${AP + sh} ${xl + 4} ${AP + sh - 4} Z`;
      const vy = AP + sh + (h - sh) * 0.52;
      const vfs = Math.round(40 + 16 * r);
      const g = svg
        .append('g')
        .attr('class', `tags_tag tags_tag--${it.cls}`)
        .style('transform-origin', `${cx}px ${hy}px`)
        .style('animation-delay', `${d0 + 0.35}s`);
      g.append('path').attr('class', 'tags_shape').attr('d', shape);
      g.append('circle').attr('class', 'tags_hole').attr('cx', cx).attr('cy', hy).attr('r', 11);
      g.append('text')
        .attr('class', 'tags_value')
        .attr('data-v', it.v)
        .attr('data-d', d0 + 0.6)
        .attr('x', cx)
        .attr('y', vy)
        .attr('text-anchor', 'middle')
        .attr('font-size', vfs)
        .text(TAGS.played ? `+${it.v.toFixed(1)}` : '+0.0');
      g.append('text')
        .attr('class', 'tags_unit')
        .attr('x', cx)
        .attr('y', vy + 22 * k + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', 21 * k)
        .text('points');
    }
    if (TAGS.played) {
      svg.classed('is-playing is-static', true);
      return;
    }
    TAGS.run = instant => {
      TAGS.played = true;
      svg.classed('is-playing', true);
      if (instant) svg.classed('is-static', true);
      svg.selectAll('.tags_value').each(function () {
        const t = d3.select(this);
        const to = Number(t.attr('data-v'));
        if (instant) {
          t.text(`+${to.toFixed(1)}`);
          return;
        }
        tween(1300, q => t.text(`+${(to * d3.easeCubicOut(q)).toFixed(1)}`), null, Number(t.attr('data-d')) * 1000);
      });
    };
    if (!TAGS.armed) {
      TAGS.armed = true;
      onceVisible(el, instant => TAGS.run(instant), 0.35);
    }
  }, [payload]);

  useEffect(() => {
    draw();
  }, [draw]);
  useWidthRedraw(draw, !!payload);

  return (
    <Block id="fp-households" nav="Households" tinted>
      <ChartHeader
        subtitle="Additional inflation faced by poorest compared to richest households per country group, in percentage points."
        title={
          <>
            Cost-of-living crises hit <Accent yellow>poorer households</Accent> hardest.
          </>
        }
      />
      <p className="insight">Poorer households face much higher inflation than wealthier households during cost-of-living crises, because they spend more of their income on food and energy.</p>
      <p className="caption">Baseline (0) = the inflation faced by the highest-income households</p>
      <figure className="chart" ref={chartRef} />
      <ChartMeta
        note={
          'Cost-of-living crises were defined as periods where prices rise faster for basic necessities than for other goods and services and nominal wage growth. Poorest and richest households are those in the bottom 20% and top 20% of the income distribution, respectively. Median values for each country group. Developing countries include "emerging market economies" and exclude low-income developing countries.'
        }
        source="UN Trade and Development (UNCTAD), based on IMF, WEO (2026)."
      />
    </Block>
  );
}
