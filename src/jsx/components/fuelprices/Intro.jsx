import { useEffect, useRef } from 'react';
import Block from './Block.jsx';
import { onceVisible } from './helpers.js';

const SENTENCES = [
  { cls: 'intro_sentence--lead', text: 'Energy shocks go far beyond crude oil.' },
  { text: 'Fuel prices are already rising, and the cost of living is likely to rise with them.' },
  { cls: 'intro_sentence--one-line', text: 'The impact will reach every corner of the world.' },
  { cls: 'intro_sentence--last', text: 'But vulnerable households are being hit hardest.' }
];

export default function Intro() {
  const ref = useRef(null);

  useEffect(() => {
    const sec = ref.current;
    const lines = [...sec.querySelectorAll('.intro_sentence')];
    const timers = [];
    const stop = onceVisible(
      sec,
      instant => {
        sec.classList.add('is-playing');
        if (instant) {
          for (const p of lines) p.classList.add('is-in');
          return;
        }
        for (const [i, t] of [350, 1650, 2950, 4650].entries()) timers.push(setTimeout(() => lines[i].classList.add('is-in'), t));
      },
      0.45
    );
    return () => {
      stop();
      for (const t of timers) clearTimeout(t);
    };
  }, []);

  return (
    <div ref={ref}>
      <Block className="block--intro" id="fp-intro" inner={false} nav="Introduction">
        <svg aria-hidden="true" className="intro_waves" viewBox="-500 -500 1000 1000">
          {[140, 260, 380].map(r => (
            <circle className="intro_trace" key={r} r={r} />
          ))}
          {[0, 1, 2, 3].map(i => (
            <circle className="intro_ring" key={i} r="40" />
          ))}
          <circle className="intro_core" r="7" />
        </svg>
        <div className="intro_text">
          {SENTENCES.map(s => (
            <p className={`intro_sentence${s.cls ? ` ${s.cls}` : ''}`} key={s.text}>
              {s.text}
            </p>
          ))}
        </div>
      </Block>
    </div>
  );
}
