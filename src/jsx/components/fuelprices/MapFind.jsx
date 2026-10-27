import { useEffect, useId, useMemo, useRef, useState } from 'react';

const MAX_HITS = 7;
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const pct = v => (v == null ? 'n/a' : `${v > 0 ? '+' : ''}${Math.round(v)}%`);

/** Suggestion text with the typed part in bold. */
function Match({ name, query }) {
  const i = norm(name).indexOf(query);
  if (i < 0) return name;
  return (
    <>
      {name.slice(0, i)}
      <b>{name.slice(i, i + query.length)}</b>
      {name.slice(i + query.length)}
    </>
  );
}

/** Search field with its own suggestion list (arrow keys, Enter, Escape) and a box with the two price changes of the economy found. */
export default function MapFind({ classes, countries, found, onFound }) {
  const id = useId();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [cur, setCur] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const query = norm(text.trim());
  const sorted = useMemo(() => [...countries].sort((a, b) => a.n.localeCompare(b.n)), [countries]);
  const hits = useMemo(() => {
    if (!query) return [];
    const starts = sorted.filter(c => norm(c.n).startsWith(query));
    return starts.concat(sorted.filter(c => !starts.includes(c) && norm(c.n).includes(query))).slice(0, MAX_HITS);
  }, [sorted, query]);
  const listed = open && query;

  // Keep the active suggestion in view by scrolling the list only, never the page
  useEffect(() => {
    const ul = listRef.current;
    const li = ul?.children[cur];
    if (!li) return;
    if (li.offsetTop < ul.scrollTop) ul.scrollTop = li.offsetTop;
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight;
  }, [cur]);

  const pick = c => {
    setText(c.n);
    setOpen(false);
    onFound(c);
  };
  const clear = () => {
    setText('');
    setOpen(false);
    onFound(null);
  };
  const onInput = e => {
    const value = e.target.value;
    const q = norm(value.trim());
    setText(value);
    setCur(0);
    setOpen(!!q);
    if (!q) onFound(null);
    else {
      const exact = countries.find(c => norm(c.n) === q);
      if (exact) onFound(exact);
    }
  };
  const onKeyDown = e => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!listed || !hits.length) return;
      e.preventDefault();
      setCur((cur + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length);
    } else if (e.key === 'Enter') {
      if (listed && hits[cur]) {
        e.preventDefault();
        pick(hits[cur]);
      }
    } else if (e.key === 'Escape') {
      if (listed) setOpen(false);
      else clear();
    }
  };

  const colorOf = v => (v == null ? null : classes.find(c => v <= c.hi)?.color);
  const row = (name, v) => (
    <div key={name}>
      <dt>
        <i className={v == null ? 'maps_find_key--none' : undefined} style={{ background: colorOf(v) }} />
        {name}
      </dt>
      <dd>{pct(v)}</dd>
    </div>
  );

  return (
    <div className="maps_find">
      <label className="maps_find_label" htmlFor={`${id}-input`}>
        Find an economy
      </label>
      <div className="maps_find_field">
        <svg aria-hidden="true" className="maps_find_icon" viewBox="0 0 20 20">
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M12.6 12.6 17 17" />
        </svg>
        <input
          aria-activedescendant={listed && hits.length ? `${id}-opt-${cur}` : undefined}
          aria-autocomplete="list"
          aria-controls={`${id}-list`}
          aria-expanded={!!listed}
          autoComplete="off"
          className="maps_find_input"
          id={`${id}-input`}
          onBlur={() => setOpen(false)}
          onChange={onInput}
          onFocus={() => {
            if (query && hits.length && !found) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a country"
          ref={inputRef}
          role="combobox"
          spellCheck="false"
          type="text"
          value={text}
        />
        {text && (
          <button
            aria-label="Clear the search"
            className="maps_find_clear"
            onClick={() => {
              clear();
              inputRef.current?.focus();
            }}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        )}
        {listed && (
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA combobox pattern, the options are reached with the input's arrow keys
          <ul aria-label="Economies" className="maps_find_list" id={`${id}-list`} ref={listRef} role="listbox">
            {hits.length ? (
              hits.map((c, i) => (
                // biome-ignore lint/a11y/useFocusableInteractive: ARIA combobox pattern, focus stays in the input (aria-activedescendant) and the keyboard works there
                <li
                  aria-selected={i === cur}
                  className={i === cur ? 'is-on' : undefined}
                  id={`${id}-opt-${i}`}
                  key={c.c}
                  onMouseDown={e => {
                    e.preventDefault();
                    pick(c);
                  }}
                  onMouseMove={() => i !== cur && setCur(i)}
                  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA combobox pattern
                  role="option"
                >
                  <Match name={c.n} query={query} />
                </li>
              ))
            ) : (
              <li className="maps_find_none">No economy found</li>
            )}
          </ul>
        )}
      </div>
      <div aria-live="polite" className="maps_find_card">
        {found && (
          <>
            <p className="maps_find_name">{found.n}</p>
            <p className="maps_find_group">
              {found.s === 'developed' ? 'Developed' : 'Developing'} economy · {found.r}
            </p>
            <dl className="maps_find_values">
              {row('Diesel', found.d)}
              {row('Gasoline', found.g)}
            </dl>
          </>
        )}
      </div>
    </div>
  );
}
