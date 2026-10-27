import { useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { ChartHeader } from './ChartParts.jsx';
import { onceVisible } from './helpers.js';

const KEYS = [
  { icon: 'ic-k-infl', text: 'Increases in international energy prices quickly translate into higher domestic fuel prices.', strong: 'This raises the cost of living.', title: 'Broader inflation' },
  { icon: 'ic-k-fisc', text: 'Efforts to shield households from fuel price spikes amid prolonged disruptions to energy markets put', strong: 'greater pressure on government finances', end: '.', title: 'Fiscal pressures' },
  { icon: 'ic-k-mon', text: 'Rising fuel import costs are exacerbating foreign-exchange shortages. Hikes in monetary policy rates in response to increasing inflation raise borrowing costs and', strong: 'add to the fiscal strains of debt-burdened economies', end: '.', title: 'Monetary pressures' },
  { icon: 'ic-k-slow', text: 'Amid soaring energy prices, global economic growth is likely to slow down to', strong: '2.6% in 2026', end: '.', title: 'Economic slowdown' },
  { icon: 'ic-k-energy', text: 'High fossil fuel prices make the energy transition and grid investment even more critical for development, resilience and energy security.', strong: 'But heightened volatility in commodity prices makes it more complex.', title: 'Energy transition' }
];

export default function KeyConsiderations() {
  const ref = useRef(null);

  useEffect(() => {
    const stops = [...ref.current.querySelectorAll('.hz_key')].map(row => onceVisible(row, () => row.classList.add('is-in'), 0.35));
    return () => {
      for (const s of stops) s();
    };
  }, []);

  return (
    <Block className="hz_block--keys" id="hz-keys" nav="Key considerations">
      <ChartHeader title="Key considerations" />
      <ol className="hz_keys" ref={ref}>
        {KEYS.map(k => (
          <li className="hz_key" key={k.title}>
            <span className="hz_key_icon">
              <svg aria-hidden="true">
                <use href={`#${k.icon}`} />
              </svg>
            </span>
            <div className="hz_key_text">
              <h4 className="hz_key_title">{k.title}</h4>
              <p className="hz_key_body">
                {k.text} <strong>{k.strong}</strong>
                {k.end}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Block>
  );
}
