import { useEffect, useRef } from 'react';
import { isStill } from './helpers.js';

const REVEAL = '.chart_header, .legend, .meta, .insight, .statement';

/** Page section: optional inner wrapper (max-width) and a fade-up reveal for headers, legends and source lines. */
export default function Block({ children, className = '', id, inner = true, tinted }) {
  const ref = useRef(null);

  useEffect(() => {
    if (isStill() || !ref.current) return;
    const els = [...ref.current.querySelectorAll(REVEAL)];
    for (const e of els) e.classList.add('reveal');
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
    <section className={`block${tinted ? ' block--tinted' : ''}${className ? ` ${className}` : ''}`} id={id} ref={ref}>
      {inner ? <div className="block_inner">{children}</div> : children}
    </section>
  );
}
