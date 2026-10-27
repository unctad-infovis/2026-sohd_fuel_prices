import { useEffect, useRef } from 'react';
import { isStill } from './helpers.js';

const REVEAL = '.hz_header, .hz_legend, .hz_meta, .hz_insight, .hz_statement';

/** Page section: optional inner wrapper (max-width) and a fade-up reveal for headers, legends and source lines. */
export default function Block({ children, className = '', id, inner = true, nav, tinted }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isStill() || !ref.current) return;
    const els = [...ref.current.querySelectorAll(REVEAL)];
    for (const e of els) e.classList.add('hz_reveal');
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    for (const e of els) io.observe(e);
    return () => io.disconnect();
  }, []);

  return (
    <section className={`hz_block${tinted ? ' hz_block--tinted' : ''}${className ? ` ${className}` : ''}`} data-nav={nav} id={id} ref={ref}>
      {inner ? <div className="hz_block_inner">{children}</div> : children}
    </section>
  );
}
