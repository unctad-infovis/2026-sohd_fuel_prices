import * as d3 from 'd3';
import { useCallback, useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta, HATCH_LEGEND, Legend } from './ChartParts.jsx';
import { CONFLICT_LABEL, conflictLabel, drawAxis, drawGrid, easeInOut, onceVisible, svgFor, tween, useFuelData, useWidthRedraw } from './helpers.js';

export default function GapChart() {
  const payload = useFuelData();
  const chartRef = useRef(null);
  const S = useRef({ armed: false, played: false, running: false });

  const draw = useCallback(() => {
    const el = chartRef.current;
    if (!el || !payload) return;
    const GAP = S.current;
    const f = payload.data.infl;
    const T = f.t;
    const A = f.developing;
    const B = f.developed;
    const n = T.length;
    const W = el.clientWidth || 760;
    const narrow = W < 600;
    const H = narrow ? 330 : Math.max(340, Math.min(470, Math.round(W * 0.46)));
    const m = { b: 46, l: narrow ? 28 : 40, r: narrow ? 92 : 176, t: narrow ? 52 : 40 };
    const x = d3.scaleUtc([Date.UTC(2024, 11, 20), T[n - 1]], [m.l, W - m.r]);
    const y = d3.scaleLinear([0, 5.4], [H - m.b, m.t]);
    const iC = T.findIndex(t => t >= Date.UTC(2026, 1, 1));
    const cx = x(T[iC]);
    const xe = x(T[n - 1]);
    const svg = svgFor(el, W, H, 'Monthly inflation rate: developing countries rose from 3.2% in February 2026 to 4.8% in August 2026, developed countries from 2.5% to 3.2%; the gap between the two groups widened from 0.7 to 1.6 percentage points.');
    const defs = svg.append('defs');
    const gr = defs.append('linearGradient').attr('id', 'fp-gap-grad').attr('gradientUnits', 'userSpaceOnUse').attr('x1', 0).attr('x2', W).attr('y1', 0).attr('y2', 0);
    gr.append('stop')
      .attr('class', 'gap_before')
      .attr('offset', (cx / W).toFixed(4));
    gr.append('stop')
      .attr('class', 'gap_after')
      .attr('offset', (cx / W).toFixed(4));
    const clip = defs.append('clipPath').attr('id', 'fp-gap-clip').append('rect').attr('x', 0).attr('y', 0).attr('width', 0).attr('height', H);
    svg
      .append('rect')
      .attr('data-ev', 'c')
      .attr('x', cx)
      .attr('y', m.t)
      .attr('width', xe - cx)
      .attr('height', H - m.t - m.b)
      .style('fill', 'url(#fp-hatch-yellow)');
    drawGrid(
      svg,
      y,
      xe + 4,
      [1, 2, 3, 4, 5].map(v => ({ label: v === 5 ? '5%' : v, v }))
    );
    drawAxis(
      svg,
      y(0),
      xe + 4,
      [
        [2025, 0, 'Jan', '2025'],
        [2025, 6, 'Jul'],
        [2026, 0, 'Jan', '2026'],
        [2026, 6, 'Jul']
      ].map(([yr, mo, label, year]) => ({ label, x: x(Date.UTC(yr, mo, 15)), year }))
    );
    const cg = svg.append('g').attr('data-ev', 'c');
    cg.append('line')
      .attr('class', 'oil_conflict')
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', m.t - 30)
      .attr('y2', y(0))
      .style('stroke-width', 2.5);
    cg.append('use')
      .attr('href', '#ic-burst')
      .attr('x', cx - 19)
      .attr('y', y(0) - 28)
      .attr('width', 38)
      .attr('height', 28);
    conflictLabel(cg, CONFLICT_LABEL, cx - 8, m.t - 18);
    const line = arr =>
      d3
        .line()
        .x((_, k) => x(T[k]))
        .y(v => y(v))(arr);
    svg
      .append('path')
      .attr(
        'd',
        d3
          .area()
          .x((_, k) => x(T[k]))
          .y0((_, k) => y(B[k]))
          .y1((_, k) => y(A[k]))(T)
      )
      .style('fill', 'url(#fp-gap-grad)')
      .attr('clip-path', 'url(#fp-gap-clip)');
    svg.append('path').attr('class', 'gap_line gap_line--dev').attr('d', line(A)).attr('clip-path', 'url(#fp-gap-clip)');
    svg.append('path').attr('class', 'gap_line gap_line--dvd').attr('d', line(B)).attr('clip-path', 'url(#fp-gap-clip)');
    const fsv = narrow ? 'var(--un-font-size-xxxs)' : 'var(--un-font-size-xxs)';
    svg
      .append('text')
      .attr('class', 'gap_dev')
      .attr('x', x(T[0]) - 14)
      .attr('y', y(A[0]) - 6)
      .attr('text-anchor', 'end')
      .style('font-size', fsv)
      .text(`${A[0].toFixed(1)}%`);
    svg
      .append('text')
      .attr('class', 'gap_dvd')
      .attr('x', x(T[0]) - 14)
      .attr('y', y(B[0]) + 16)
      .attr('text-anchor', 'end')
      .style('font-size', fsv)
      .text(`${B[0].toFixed(1)}%`);
    // Open circles mark where the lines start, like the end points
    svg.append('circle').attr('class', 'point point--blue').attr('cx', x(T[0])).attr('cy', y(A[0])).attr('r', 5.5).attr('clip-path', 'url(#fp-gap-clip)');
    svg.append('circle').attr('class', 'point point--yellow').attr('cx', x(T[0])).attr('cy', y(B[0])).attr('r', 5.5).attr('clip-path', 'url(#fp-gap-clip)');
    // Reading head: two dots that ride on the lines while they draw
    const live = svg.append('g').style('opacity', 0);
    const ha = live.append('circle').attr('class', 'head_dot head_dot--blue').attr('r', 5.5);
    const hb = live.append('circle').attr('class', 'head_dot head_dot--yellow').attr('r', 5.5);
    const ya = y(A[n - 1]);
    const yb = y(B[n - 1]);
    const bx = xe + 14;
    const eg = svg.append('g').attr('data-ev', 'e');
    eg.append('circle').attr('class', 'point point--blue').attr('cx', xe).attr('cy', ya).attr('r', 5.5);
    eg.append('circle').attr('class', 'point point--yellow').attr('cx', xe).attr('cy', yb).attr('r', 5.5);
    for (const [name, v, yy, cls] of [
      ['Developing', A[n - 1], ya, 'gap_dev'],
      ['Developed', B[n - 1], yb, 'gap_dvd']
    ]) {
      eg.append('text')
        .attr('class', `${cls} gap_end_name`)
        .attr('x', bx + 6)
        .attr('y', yy - (narrow ? 16 : 22))
        .style('font-size', narrow ? 'var(--un-font-size-xxxs)' : 'var(--un-font-size-xs)')
        .text(name);
      eg.append('text')
        .attr('class', `${cls} gap_end_value`)
        .attr('x', bx + 4)
        .attr('y', yy + (narrow ? 9 : 14))
        .style('font-size', narrow ? 'var(--un-font-size-xl)' : 'var(--un-font-size-xxxl)')
        .text(`${v.toFixed(1)}%`);
    }
    cg.raise(); // The conflict line is drawn over the area, the lines and the dots
    const valAt = (arr, xp) => {
      for (let k = 0; k < n - 1; k++) {
        const a = x(T[k]);
        const b = x(T[k + 1]);
        if (xp <= b) {
          const q = Math.max(0, Math.min(1, (xp - a) / (b - a)));
          return arr[k] + (arr[k + 1] - arr[k]) * q;
        }
      }
      return arr[n - 1];
    };
    const show = ev => svg.selectAll(`[data-ev="${ev}"]`).classed('is-on', true);
    const set = xp => {
      clip.attr('width', xp);
      const xx = Math.max(x(T[0]), Math.min(xe, xp));
      ha.attr('cx', xx).attr('cy', y(valAt(A, xx)));
      hb.attr('cx', xx).attr('cy', y(valAt(B, xx)));
    };
    const finish = () => {
      clip.attr('width', xe + 6);
      show('c');
      show('e');
      live.style('opacity', 0);
    };
    if (GAP.played) {
      finish();
      return;
    }
    GAP.run = instant => {
      GAP.played = true;
      if (instant) {
        finish();
        return;
      }
      GAP.running = true;
      live.style('opacity', 1);
      const xs = x(T[0]) - 2;
      const xc = x(T[iC]);
      tween(
        2600,
        t => set(xs + (xc - xs) * easeInOut(t)),
        () => {
          show('c');
          setTimeout(
            () =>
              tween(
                2400,
                t => set(xc + (xe - xc) * easeInOut(t)),
                () => {
                  GAP.running = false;
                  finish();
                }
              ),
            1200
          );
        }
      );
    };
    if (!GAP.armed) {
      GAP.armed = true;
      onceVisible(el, instant => GAP.run(instant), 0.35);
    }
  }, [payload]);

  useEffect(() => {
    draw();
  }, [draw]);
  useWidthRedraw(draw, !!payload);

  return (
    <Block id="fp-inflation" nav="Inflation" tinted>
      <ChartHeader
        subtitle="Monthly year-on-year inflation rate in developed and developing countries, median by country group."
        title={
          <>
            Inflation is rising, particularly in <Accent>developing countries</Accent>.
          </>
        }
      />
      <Legend items={[{ label: 'Developing countries' }, { label: 'Developed countries', line: 'legend_key--yellow' }, HATCH_LEGEND]} />
      <figure className="chart" ref={chartRef} />
      <ChartMeta
        note="The depicted data covers 91 developing countries (33 in Africa, 23 in Latin America and the Caribbean, 35 in Asia and Oceania) and 47 developed countries for which inflation data was available for August 2026."
        source="UN Trade and Development (UNCTAD), based on national sources and IMF retrieved from LSEG Datastream."
      />
    </Block>
  );
}
