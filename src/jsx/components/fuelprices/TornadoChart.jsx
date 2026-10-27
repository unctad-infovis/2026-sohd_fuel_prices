import * as d3 from 'd3';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { onceVisible, tween, useFuelData } from './helpers.js';

export default function TornadoChart() {
  const payload = useFuelData();
  const ref = useRef(null);
  const L = payload?.data.ldc;
  const mx = L ? d3.max(L, d => Math.max(d.d, d.g)) : 1;
  const [sort, setSort] = useState('d'); // 'd' keeps the data order (diesel), 'g' orders by gasoline
  const from = useRef(null);
  const rows = L ? L.map((d, i) => ({ ...d, i })) : [];
  if (sort === 'g') rows.sort((a, b) => b.g - a.g);

  // Rows slide to their new places when the order changes (the layout effect runs after every render but only acts after a click)
  const reorder = to => {
    if (to === sort) return;
    from.current = new Map([...ref.current.querySelectorAll('.tornado_row')].map(r => [r.dataset.n, r.getBoundingClientRect().top]));
    setSort(to);
  };
  useLayoutEffect(() => {
    if (!from.current) return;
    const before = from.current;
    from.current = null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (const r of ref.current.querySelectorAll('.tornado_row')) {
      const dy = before.get(r.dataset.n) - r.getBoundingClientRect().top;
      if (dy) r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 600, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  });

  useEffect(() => {
    const el = ref.current;
    if (!L || !el) return undefined;
    const stop = onceVisible(
      el,
      instant => {
        el.classList.add('is-playing');
        if (instant) return;
        for (const [i, row] of el.querySelectorAll('.tornado_row').entries())
          for (const b of row.querySelectorAll('.tornado_value')) {
            const to = Number(b.dataset.v);
            b.textContent = '0%';
            tween(
              1100,
              t => {
                b.textContent = `${Math.round(to * d3.easeCubicOut(t))}%`;
              },
              null,
              450 + i * 110
            );
          }
      },
      0.15
    );
    return stop;
  }, [L]);

  const label = L ? `Increase of local retail prices of diesel and gasoline in least developed countries: ${L.map(d => `${d.n}, diesel +${d.d}%, gasoline +${d.g}%`).join('; ')}.` : undefined;

  return (
    <Block id="fp-ldc" tinted>
      <ChartHeader
        subtitle="Increase of local retail prices of diesel and gasoline for least developed countries, in per cent."
        title={
          <>
            Some of the highest fuel price increases hit <Accent>vulnerable economies</Accent>.
          </>
        }
      />
      <div className="chart tornado" ref={ref}>
        {L && (
          <>
            <div className="tornado_head">
              <button aria-pressed={sort === 'd'} className="tornado_fuel tornado_fuel--d" onClick={() => reorder('d')} type="button">
                Diesel
                <svg aria-hidden="true" className="flip">
                  <use href="#ic-truck" />
                </svg>
              </button>
              <span />
              <button aria-pressed={sort === 'g'} className="tornado_fuel tornado_fuel--g" onClick={() => reorder('g')} type="button">
                <svg aria-hidden="true">
                  <use href="#ic-car" />
                </svg>
                Gasoline
              </button>
            </div>
            <div aria-label={label} className="tornado_rows" role="img">
              {rows.map(d => (
                <div aria-hidden="true" className="tornado_row" data-n={d.n} key={d.n} style={{ '--fp-i': d.i }}>
                  <div className="tornado_cell tornado_cell--d" style={{ '--fp-s': (d.d / mx).toFixed(4) }}>
                    <span className="tornado_bar" />
                    <b className="tornado_value" data-v={d.d}>
                      {d.d}%
                    </b>
                  </div>
                  <div className="tornado_name">{d.n}</div>
                  <div className="tornado_cell tornado_cell--g" style={{ '--fp-s': (d.g / mx).toFixed(4) }}>
                    <span className="tornado_bar" />
                    <b className="tornado_value" data-v={d.g}>
                      {d.g}%
                    </b>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <ChartMeta
        note="Selection of countries with the highest average increase of local diesel and gasoline prices at the pump in local currencies. Change since the start of the Middle East conflict until 19 October 2026, compared to the six months before the conflict (weekly, 1 September 2025 – 23 February 2026)."
        source="UN Trade and Development (UNCTAD), based on Global Petrol Prices and national sources."
      />
    </Block>
  );
}
