import { useEffect, useRef } from 'react';

const CONTAINER = `#app-root-${__PROJECT_NAME__} .fp_container`;

/** Reading progress along the top edge: how far the viewport has travelled through the report content. */
export default function ProgressBar() {
  const barRef = useRef(null);

  useEffect(() => {
    const container = document.querySelector(CONTAINER);
    const bar = barRef.current;
    if (!container || !bar) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = container.getBoundingClientRect();
      const p = -rect.top / Math.max(1, rect.height - window.innerHeight);
      bar.style.width = `${(Math.min(Math.max(p, 0), 1) * 100).toFixed(2)}%`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div aria-hidden="true" className="progress">
      <span className="progress_bar" ref={barRef} />
    </div>
  );
}
