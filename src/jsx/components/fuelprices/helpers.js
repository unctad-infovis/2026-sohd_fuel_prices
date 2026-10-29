import loadFile from '@unctad-infovis/general-tools/helpers/LoadFile.js';
import * as d3 from 'd3';
import { useEffect, useState } from 'react';

d3.formatDefaultLocale({ currency: ['$', ''], decimal: '.', grouping: [3], thousands: ' ' });

export const CONFLICT = Date.UTC(2026, 1, 28);
export const easeOut4 = t => 1 - (1 - t) ** 4;
export const easeInOut = d3.easeQuadInOut;
export const fmtInt = v => Math.round(v).toLocaleString('en-US').replace(/,/g, ' ');
export const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
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
  const text = parent.append('text').attr('class', 'conflict_label').attr('text-anchor', 'end').attr('y', y);
  for (const [j, l] of lines.entries())
    text
      .append('tspan')
      .attr('x', x)
      .attr('dy', j ? 16 : 0)
      .text(l);
  return text;
}

/** Dotted horizontal grid lines with their value label above the left end. ticks: [{ label, ref, v }]; ref marks the reference line (oil chart). */
export function drawGrid(svg, y, x2, ticks) {
  const grid = svg.append('g').attr('class', 'grid');
  for (const { label, ref, v } of ticks) {
    grid
      .append('line')
      .attr('class', ref ? 'oil_ref' : null)
      .attr('x1', 0)
      .attr('x2', x2)
      .attr('y1', y(v))
      .attr('y2', y(v));
    grid
      .append('text')
      .attr('class', ref ? 'oil_ref_label' : null)
      .attr('x', 0)
      .attr('y', y(v) - 6)
      .text(label ?? v);
  }
}

/** Baseline at y0 with a tick, a label and an optional bold year line under it. ticks: [{ label, x, year }] */
export function drawAxis(svg, y0, x2, ticks) {
  const ax = svg.append('g').attr('class', 'axis');
  ax.append('line').attr('class', 'axis_base').attr('x1', 0).attr('x2', x2).attr('y1', y0).attr('y2', y0);
  for (const { label, x, year } of ticks) {
    ax.append('line')
      .attr('class', 'axis_tick')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', y0)
      .attr('y2', y0 + 5);
    ax.append('text')
      .attr('x', x)
      .attr('y', y0 + 20)
      .attr('text-anchor', 'middle')
      .text(label);
    if (year)
      ax.append('text')
        .attr('class', 'axis_year')
        .attr('x', x)
        .attr('y', y0 + 36)
        .attr('text-anchor', 'middle')
        .text(year);
  }
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

/** True when position: sticky cannot work for el: an ancestor is a scroll container (overflow hidden/auto/scroll) that never actually scrolls. A host page that sets overflow-x: hidden on both html and body does this, because then body no longer hands its overflow to the viewport. */
export function stickyBroken(el) {
  const root = document.documentElement;
  const rs = getComputedStyle(root);
  const rootScrolls = rs.overflowX !== 'visible' || rs.overflowY !== 'visible';
  for (let e = el.parentElement; e && e !== root; e = e.parentElement) {
    const c = getComputedStyle(e);
    if (!/hidden|auto|scroll/.test(c.overflowX + c.overflowY)) continue;
    if (e === document.body && !rootScrolls) continue;
    if (e.scrollHeight <= e.clientHeight + 1) return true;
  }
  return false;
}

/**
 * Keeps a position: sticky element in place with position: fixed when sticky is dead (see stickyBroken), the way sticky would: static above the box, fixed at topFn(height) while the box passes, parked at the bottom of the box after it. Does nothing when sticky works. box must be positioned. Returns a cleanup.
 */
export function pinFallback(box, el, topFn) {
  let broken = false;
  let left = 0;
  let padBottom = 0;
  let width = 0;
  let mode = '';
  let frame = 0;
  const set = (position, top, x) => {
    el.style.boxSizing = 'border-box';
    el.style.position = position;
    el.style.top = `${top}px`;
    el.style.left = `${x}px`;
    el.style.width = `${width}px`;
  };
  const reset = () => {
    mode = '';
    el.style.animation = '';
    el.style.boxSizing = '';
    el.style.position = '';
    el.style.top = '';
    el.style.left = '';
    el.style.width = '';
  };
  const update = () => {
    frame = 0;
    if (!broken) return;
    const r = box.getBoundingClientRect();
    const h = el.offsetHeight;
    const t = topFn(h);
    if (r.top >= t) {
      if (mode) reset();
    } else if (r.bottom - padBottom - h <= t) {
      mode = 'after';
      el.style.animation = 'none'; // an animation of top (BackToTop bounces) would beat the inline top
      set('absolute', r.height - padBottom - h, left);
    } else {
      mode = 'pinned';
      set('fixed', t, r.left + left);
    }
  };
  const measure = () => {
    reset();
    broken = stickyBroken(el);
    left = el.offsetLeft;
    padBottom = Number.parseFloat(getComputedStyle(box).paddingBottom) || 0;
    width = el.offsetWidth;
    update();
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const ro = new ResizeObserver(measure);
  ro.observe(box);
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => {
    ro.disconnect();
    window.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(frame);
    reset();
  };
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
