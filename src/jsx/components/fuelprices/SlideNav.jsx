import { useEffect, useRef, useState } from 'react';
import { isStill } from './helpers.js';
import './SlideNav.css';

// Queries stay inside this project's root element, so the page around it is never touched
const ROOT = `#app-root-${__PROJECT_NAME__}`;
const CONTAINER = `${ROOT} .fp_container`;

function scrollToY(target) {
  const start = window.scrollY;
  const dist = Math.round(target) - start;
  if (!dist) return;
  if (isStill()) {
    window.scrollTo(0, target);
    return;
  }
  const duration = 550;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  let t0 = null;
  const step = ts => {
    if (t0 === null) t0 = ts;
    const p = Math.min((ts - t0) / duration, 1);
    window.scrollTo(0, start + dist * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const sections = () => [...document.querySelectorAll(`${CONTAINER} [data-nav]`)];

function scrollToSection(index) {
  const el = sections()[index];
  if (el) scrollToY(el.getBoundingClientRect().top + window.scrollY);
}

/** Dot navigation on the right: one dot per [data-nav] section inside the container. */
export default function SlideNav() {
  const [labels, setLabels] = useState([]);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  activeRef.current = active;
  const count = labels.length;

  useEffect(() => {
    setLabels(sections().map(el => el.dataset.nav));
    const container = document.querySelector(CONTAINER);
    if (!container) return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const els = sections();
    if (!els.length) return undefined;
    const update = () => {
      const midY = window.scrollY + window.innerHeight / 2;
      const firstTop = els[0].getBoundingClientRect().top + window.scrollY;
      const lastBottom = els[els.length - 1].getBoundingClientRect().bottom + window.scrollY;
      if (midY < firstTop) {
        setActive(-1);
        return;
      }
      if (midY > lastBottom) {
        setActive(els.length);
        return;
      }
      // The last section that has started above the middle of the screen
      let cur = 0;
      for (const [i, el] of els.entries()) if (el.getBoundingClientRect().top + window.scrollY <= midY) cur = i;
      setActive(cur);
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
    return () => window.removeEventListener('scroll', update);
  }, []);

  const goDown = () => {
    const cur = activeRef.current;
    const n = sections().length;
    if (cur < 0) scrollToSection(0);
    else if (cur < n - 1) scrollToSection(cur + 1);
    else {
      const footer = document.querySelector(`${ROOT} .block--quote`);
      if (footer) scrollToY(footer.getBoundingClientRect().top + window.scrollY);
    }
  };

  const goUp = () => {
    const cur = activeRef.current;
    if (cur >= sections().length) scrollToSection(sections().length - 1);
    else if (cur > 0) scrollToSection(cur - 1);
    else scrollToY(0);
  };

  const goDownRef = useRef(goDown);
  const goUpRef = useRef(goUp);
  goDownRef.current = goDown;
  goUpRef.current = goUp;

  useEffect(() => {
    const onKeyDown = e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goDownRef.current();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goUpRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const progress = count > 1 ? Math.max(0, Math.min(1, active / (count - 1))) : 0;

  return (
    <div className={`slide_nav${visible ? ' slide_nav_visible' : ''}`}>
      <button aria-label="Previous section" className="slide_nav_arrow" onClick={goUp} type="button">
        <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>

      <div className="slide_nav_track" style={{ '--progress': progress }}>
        {labels.map((label, i) => (
          <button aria-label={`Go to ${label}`} className={`slide_nav_dot${i === active ? ' slide_nav_dot_active' : ''}`} key={label} onClick={() => scrollToSection(i)} title={label} type="button" />
        ))}
      </div>

      <button aria-label="Next section" className="slide_nav_arrow slide_nav_arrow_down" onClick={goDown} type="button">
        <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
