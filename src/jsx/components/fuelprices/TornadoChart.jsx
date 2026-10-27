import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { Accent, ChartHeader, ChartMeta } from './ChartParts.jsx';
import { onceVisible, tween, useFuelData } from './helpers.js';

export default function TornadoChart() {
  const payload = useFuelData();
  const ref = useRef(null);
  const L = payload?.data.ldc;
  const mx = L ? d3.max(L, d => Math.max(d.d, d.g)) : 1;

  useEffect(() => {
    const el = ref.current;
    if (!L || !el) return undefined;
    // Value labels move outside the bar when the bar is too short to hold them
    const fit = () => {
      for (const c of el.querySelectorAll('.tornado_cell')) {
        const b = c.querySelector('.tornado_value');
        const w = c.clientWidth * Number(c.style.getPropertyValue('--fp-s'));
        c.classList.toggle('is-out', w < b.offsetWidth + 10);
      }
    };
    fit();
    window.addEventListener('resize', fit);
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
    return () => {
      window.removeEventListener('resize', fit);
      stop();
    };
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
      <div aria-label={label} className="chart tornado" ref={ref} role="img">
        {L && (
          <>
            <div aria-hidden="true" className="tornado_head">
              <span className="tornado_fuel tornado_fuel--d">
                Diesel
                <svg aria-hidden="true" className="flip">
                  <use href="#ic-truck" />
                </svg>
              </span>
              <span />
              <span className="tornado_fuel tornado_fuel--g">
                <svg aria-hidden="true">
                  <use href="#ic-car" />
                </svg>
                Gasoline
              </span>
            </div>
            {L.map((d, i) => (
              <div aria-hidden="true" className="tornado_row" key={d.n} style={{ '--fp-i': i }}>
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
