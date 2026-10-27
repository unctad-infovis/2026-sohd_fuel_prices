import loadFile from '@unctad-infovis/general-tools/helpers/LoadFile.js';
import * as d3 from 'd3';
import { useEffect, useState } from 'react';

d3.formatDefaultLocale({ currency: ['$', ''], decimal: '.', grouping: [3], thousands: ' ' });

export const CONFLICT = Date.UTC(2026, 1, 28);
export const easeOut4 = t => 1 - (1 - t) ** 4;
export const easeInOut = d3.easeQuadInOut;
export const fmtInt = v => Math.round(v).toLocaleString('en-US').replace(/,/g, ' ');
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const color = name => `var(--un-color-${name})`;
export const isStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Resolved value of a --un-color-* design token (Highcharts needs real colour strings, not var()). */
export const tokenColor = name => getComputedStyle(document.documentElement).getPropertyValue(`--un-color-${name}`).trim();
export const tokPx = name => Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue(`--un-font-size-${name}`)) || 14;

/** Run fn once, the first time el is on screen enough. fn receives true when animation should be skipped. */
export function onceVisible(el, fn, threshold = 0.3) {
  if (!el) return () => {};
  if (isStill()) {
    fn(true);
    return () => {};
  }
  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        const enough = e.intersectionRatio >= threshold || e.intersectionRect.height >= window.innerHeight * 0.5;
        if (e.isIntersecting && enough) {
          io.disconnect();
          fn(false);
        }
      }
    },
    { threshold: [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8, 1] }
  );
  io.observe(el);
  return () => io.disconnect();
}

/** Animate t from 0 to 1 over dur ms with d3.timer; calls step(t) and then done(). */
export function tween(dur, step, done, delay = 0) {
  if (isStill() || dur <= 0) {
    step(1);
    if (done) done();
    return null;
  }
  const timer = d3.timer(elapsed => {
    const t = Math.min(1, elapsed / dur);
    step(t);
    if (t >= 1) {
      timer.stop();
      if (done) done();
    }
  }, delay);
  return timer;
}

export const CONFLICT_LABEL = ['Start of the Middle East', 'conflict, 28 Feb 2026'];
export const CONFLICT_LABEL_NARROW = ['Start of the', 'Middle East conflict,', '28 Feb 2026'];

/** Conflict annotation shared by the line charts: right-aligned text to the left of the conflict line, one tspan per line. */
export function conflictLabel(parent, lines, x, y) {
  const text = parent.append('text').attr('class', 'hz_conflict_label').attr('text-anchor', 'end').attr('y', y);
  for (const [j, l] of lines.entries())
    text
      .append('tspan')
      .attr('x', x)
      .attr('dy', j ? 16 : 0)
      .text(l);
  return text;
}

export function svgFor(el, W, H, label) {
  return d3.select(el).html('').append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('width', W).attr('height', H).attr('role', 'img').attr('aria-label', label);
}

let dataPromise = null;
let topologyPromise = null;
/** Official UN world map topology (shared by all UNCTAD map projects), loaded once. */
export function useTopology() {
  const [topology, setTopology] = useState(null);
  useEffect(() => {
    topologyPromise = topologyPromise || loadFile('assets/data/worldmap-economies-54030.topo.json').then(r => r?.json());
    let alive = true;
    topologyPromise.then(t => {
      if (alive && t) setTopology(t);
    });
    return () => {
      alive = false;
    };
  }, []);
  return topology;
}

/** Shared datasets, loaded once: { data, globe, ill }. */
export function useFuelData() {
  const [payload, setPayload] = useState(null);
  useEffect(() => {
    dataPromise = dataPromise || loadFile(`assets/data/${__PROJECT_NAME__}_data.json`).then(r => r?.json());
    let alive = true;
    dataPromise.then(d => {
      if (alive && d) setPayload(d);
    });
    return () => {
      alive = false;
    };
  }, []);
  return payload;
}

/** Calls redraw (debounced) when the window width changes. */
export function useWidthRedraw(redraw, active) {
  useEffect(() => {
    if (!active) return;
    let timer;
    let lastW = window.innerWidth;
    const onResize = () => {
      if (Math.abs(window.innerWidth - lastW) < 2) return;
      lastW = window.innerWidth;
      clearTimeout(timer);
      timer = setTimeout(redraw, 180);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(timer);
    };
  }, [redraw, active]);
}
