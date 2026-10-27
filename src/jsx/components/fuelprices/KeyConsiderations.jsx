import { useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { ChartHeader } from './ChartParts.jsx';
import { onceVisible } from './helpers.js';

// Body text segments: a plain string, { b } for bold, { href, parts } for a link (href is a key of the urls prop)
const KEYS = [
  { icon: 'ic-k-infl', body: ['Increases in international energy prices quickly translate into higher domestic fuel prices. ', { b: 'This raises the cost of living.' }], title: 'Broader inflation' },
  { icon: 'ic-k-fisc', body: ['Efforts to shield households from fuel price spikes amid prolonged disruptions to energy markets put ', { b: 'greater pressure on government finances' }, '.'], title: 'Fiscal pressures' },
  {
    icon: 'ic-k-mon',
    body: ['Rising fuel import costs are exacerbating foreign-exchange shortages. Hikes in monetary policy rates in response to increasing inflation raise borrowing costs and ', { b: 'add to the ' }, { href: 'world_of_debt_url', parts: [{ b: 'fiscal strains of debt-burdened economies' }] }, '.'],
    title: 'Monetary pressures'
  },
  { icon: 'ic-k-slow', body: ['Amid soaring energy prices, global economic growth is likely to ', { href: 'tdr_url', parts: ['slow down to ', { b: '2.6% in 2026' }] }, '.'], title: 'Economic slowdown' },
  { icon: 'ic-k-energy', body: ['High fossil fuel prices make the energy transition and grid investment even more critical for development, resilience and energy security. ', { b: 'But heightened volatility in commodity prices makes it more complex.' }], title: 'Energy transition' }
];

function Segments({ parts, urls }) {
  return parts.map((p, i) => {
    // Segments are static and never reorder, so the index is a stable key
    const key = i;
    if (typeof p === 'string') return p;
    if (p.b) return <strong key={key}>{p.b}</strong>;
    return (
      <a href={urls[p.href]} key={key} rel="noopener" target="_blank">
        <Segments parts={p.parts} urls={urls} />
      </a>
    );
  });
}

export default function KeyConsiderations({ tdr_url, world_of_debt_url }) {
  const urls = { tdr_url, world_of_debt_url };
  const ref = useRef(null);

  useEffect(() => {
    const stops = [...ref.current.querySelectorAll('.key')].map(row => onceVisible(row, () => row.classList.add('is-in'), 0.35));
    return () => {
      for (const s of stops) s();
    };
  }, []);

  return (
    <Block className="block--keys" id="fp-keys" nav="Key considerations">
      <ChartHeader title="Key considerations" />
      <ol className="keys" ref={ref}>
        {KEYS.map(k => (
          <li className="key" key={k.title}>
            <span className="key_icon">
              <svg aria-hidden="true">
                <use href={`#${k.icon}`} />
              </svg>
            </span>
            <div className="key_text">
              <h4 className="key_title">{k.title}</h4>
              <p className="key_body">
                <Segments parts={k.body} urls={urls} />
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Block>
  );
}
