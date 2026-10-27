import * as d3 from 'd3';
import { useCallback, useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { CONFLICT, CONFLICT_LABEL, CONFLICT_LABEL_NARROW, conflictLabel, drawAxis, drawGrid, easeInOut, onceVisible, svgFor, tokPx, tween, useFuelData, useWidthRedraw } from './helpers.js';

export default function OilChart() {
  const payload = useFuelData();
  const chartRef = useRef(null);
  const S = useRef({ armed: false, played: false, running: false });

  const draw = useCallback(() => {
    const el = chartRef.current;
    if (!el || !payload) return;
    const OIL = S.current;
    const o = payload.data.oil;
    const T = o.t;
    const n = T.length;
    const W = el.clientWidth || 800;
    const narrow = W < 600;
    const H = Math.max(250, Math.min(370, Math.round(W * 0.36))) + (narrow ? 34 : 0);
    const m = { b: 46, l: 40, r: 86, t: narrow ? 64 : 30 }; // Narrow: headroom for the three-line conflict label above the plot
    const x = d3.scaleUtc([T[0], T[n - 1]], [m.l, W - m.r]);
    const y = d3.scaleLinear([0, Math.ceil(d3.max(o.a) / 10) * 10 + 4], [H - m.b, m.t]);
    const mou0 = Date.UTC(2026, 5, 15);
    const mou1 = Date.UTC(2026, 6, 6);
    const svg = svgFor(el, W, H, 'Daily crude oil price, average of four regional prices, September 2025 to October 2026');
    const clipId = 'fp-oil-clip';
    const clip = svg.append('defs').append('clipPath').attr('id', clipId).append('rect').attr('x', 0).attr('y', 0).attr('height', H).attr('width', m.l);
    svg
      .append('rect')
      .attr('data-ev', 'mou')
      .attr('x', x(mou0))
      .attr('y', m.t)
      .attr('width', x(mou1) - x(mou0))
      .attr('height', H - m.t - m.b)
      .style('fill', 'url(#fp-hatch-yellow)');
    // Grid only at 50 and 100; 100 is the dotted reference
    drawGrid(svg, y, W - m.r, [{ v: 50 }, { label: '$100', ref: true, v: 100 }]);
    drawAxis(
      svg,
      y(0),
      W - m.r,
      [
        [2025, 8, 'Sep', '2025'],
        [2025, 11, 'Dec'],
        [2026, 2, 'Mar', '2026'],
        [2026, 5, 'Jun'],
        [2026, 8, 'Sep']
      ].map(([yr, mo, label, year]) => ({ label, x: x(Date.UTC(yr, mo, 1)), year }))
    );
    const cx = x(CONFLICT);
    svg
      .append('line')
      .attr('class', 'oil_conflict')
      .attr('data-ev', 'conflict')
      .attr('x1', cx)
      .attr('x2', cx)
      .attr('y1', narrow ? m.t - 50 : m.t)
      .attr('y2', y(0));
    conflictLabel(svg, narrow ? CONFLICT_LABEL_NARROW : CONFLICT_LABEL, cx - 8, narrow ? m.t - 38 : m.t + 12).attr('data-ev', 'conflict');
    svg
      .append('use')
      .attr('data-ev', 'burst')
      .attr('href', '#ic-burst')
      .attr('x', cx - 19)
      .attr('y', y(0) - 28)
      .attr('width', 38)
      .attr('height', 28);
    // Icon sized to the Islamabad MoU band, label in the empty lower part of the band
    const bw = x(mou1) - x(mou0);
    const iw = Math.max(14, Math.min(32, bw - 6));
    const mx = (x(mou0) + x(mou1)) / 2;
    svg
      .append('use')
      .attr('data-ev', 'mou')
      .attr('href', '#ic-mou')
      .attr('x', mx - iw / 2)
      .attr('y', m.t + 10)
      .attr('width', iw)
      .attr('height', iw);
    const inP = d3.range(n).filter(k => T[k] >= mou0 && T[k] <= mou1);
    const lo = d3.min(inP, k => o.a[k]);
    const fs = narrow ? tokPx('xxxxs') : tokPx('xxxs');
    const lh = fs * 1.2;
    const ly = Math.min(y(0) - lh - 10, (y(lo) + y(0)) / 2 - lh / 2 + fs * 0.35);
    const ml = svg
      .append('text')
      .attr('class', 'oil_mou_label')
      .attr('data-ev', 'mou')
      .attr('text-anchor', 'middle')
      .attr('y', ly)
      .style('font-size', narrow ? 'var(--un-font-size-xxxxs)' : 'var(--un-font-size-xxxs)');
    ml.append('tspan').attr('x', mx).text('Islamabad');
    ml.append('tspan').attr('x', mx).attr('dy', lh).text('MoU');
    svg
      .append('path')
      .attr('class', 'oil_line')
      .attr('clip-path', `url(#${clipId})`)
      .attr(
        'd',
        d3
          .line()
          .x((_, k) => x(T[k]))
          .y(v => y(v))(o.a)
      );
    const sp = svg.append('g').attr('data-ev', 'start');
    sp.append('circle').attr('class', 'point point--blue').attr('cx', x(T[0])).attr('cy', y(o.a[0])).attr('r', 5);
    sp.append('text')
      .attr('class', 'value value--blue')
      .attr('x', x(T[0]))
      .attr('y', y(o.a[0]) - 14)
      .attr('text-anchor', 'middle')
      .text(Math.round(o.a[0]));
    const ep = svg.append('g').attr('data-ev', 'end');
    ep.append('circle')
      .attr('class', 'point point--blue')
      .attr('cx', x(T[n - 1]))
      .attr('cy', y(o.a[n - 1]))
      .attr('r', 5);
    ep.append('text')
      .attr('class', 'value value--blue')
      .attr('x', x(T[n - 1]) + 12)
      .attr('y', y(o.a[n - 1]) + 6)
      .text(Math.round(o.a[n - 1]));
    const head = svg.append('circle').attr('class', 'oil_head').attr('r', 5.5).attr('cx', -20).attr('cy', -20);
    // Sequence: the line stops at the start of the conflict, then runs to today; the MoU band appears as the line reaches it
    const stops = [
      { dur: 1100, evs: ['burst', 'conflict'], pause: 1100, x: CONFLICT },
      { evs: ['end'], pause: 0, x: T[n - 1] }
    ];
    const xMou = x(mou0);
    const show = ev => svg.selectAll(`[data-ev="${ev}"]`).classed('is-on', true);
    const finish = () => {
      clip.attr('width', W);
      head.style('display', 'none');
      for (const ev of ['start', 'mou'].concat(...stops.map(s => s.evs))) show(ev);
    };
    if (OIL.played || OIL.running) {
      finish();
      return;
    }
    const valAt = xp => {
      const t = x.invert(xp);
      let k = T.findIndex(tt => tt >= t);
      if (k <= 0) k = 1;
      const f = (t - T[k - 1]) / (T[k] - T[k - 1] || 1);
      return o.a[k - 1] + (o.a[k] - o.a[k - 1]) * Math.max(0, Math.min(1, f));
    };
    OIL.run = instant => {
      if (instant) {
        OIL.played = true;
        finish();
        return;
      }
      OIL.running = true;
      show('start');
      let xp = x(T[0]);
      const speed = (x(T[n - 1]) - xp) / 4800;
      let i = 0;
      let mouShown = false;
      const seg = () => {
        if (i >= stops.length) {
          OIL.played = true;
          OIL.running = false;
          head.style('display', 'none');
          return;
        }
        const st = stops[i];
        const xa = xp;
        const xb = x(st.x);
        const dur = st.dur || Math.max(300, (xb - xa) / speed);
        tween(
          dur,
          t => {
            const e = easeInOut(t);
            xp = xa + (xb - xa) * e;
            if (!mouShown && xp >= xMou) {
              mouShown = true;
              show('mou');
            }
            clip.attr('width', xp + 3);
            head.attr('cx', xp).attr('cy', y(valAt(xp)));
          },
          () => {
            for (const [j, ev] of st.evs.entries()) setTimeout(() => show(ev), j * 450);
            i++;
            setTimeout(seg, st.pause + Math.max(0, st.evs.length - 1) * 450);
          }
        );
      };
      setTimeout(seg, 300);
    };
    if (!OIL.armed) {
      OIL.armed = true;
      onceVisible(el, instant => OIL.run(instant), 0.35);
    }
  }, [payload]);

  useEffect(() => {
    draw();
  }, [draw]);
  useWidthRedraw(draw, !!payload);

  return (
    <Block id="fp-oil">
      <ChartHeader
        icon="ic-barrel"
        subtitle="Daily price of crude oil in dollars per barrel, average of four regional prices."
        title={
          <>
            Oil prices <Accent>remain high</Accent>, despite recently recovering Middle East exports.
          </>
        }
      />
      <figure className="chart" ref={chartRef} />
      <ChartMeta
        note="Prices between 1 September 2025 and 19 October 2026. Average based on Brent (Europe), WTI (Northern America), Dubai (Middle East), Urals (Russian Federation). All four regional prices surpassed US$ 100 on 10 September 2026. Islamabad MoU: Islamabad Memorandum of Understanding."
        source="UN Trade and Development (UNCTAD), based on LSEG Datastream."
      />
    </Block>
  );
}
