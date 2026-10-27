export function ChartHeader({ icon, subtitle, title }) {
  return (
    <div className="hz_header">
      <h3 className="hz_header_title">{title}</h3>
      {subtitle && (
        <h4 className={`hz_header_subtitle${icon ? ' hz_header_subtitle--icon' : ''}`}>
          {icon && (
            <svg aria-hidden="true" className="hz_header_icon">
              <use href={`#${icon}`} />
            </svg>
          )}
          {subtitle}
        </h4>
      )}
    </div>
  );
}

export function Accent({ children, yellow }) {
  return <span className={`hz_header_accent${yellow ? ' hz_header_accent--yellow' : ''}`}>{children}</span>;
}

export function ChartMeta({ children, note, source }) {
  return (
    <div className="hz_meta">
      <p className="hz_meta_row">
        <em>Source:</em> {source}
      </p>
      {note && (
        <p className="hz_meta_row">
          <em>Note:</em> {note}
        </p>
      )}
      {children}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <ul className="hz_legend">
      {items.map(item => (
        <li className="hz_legend_item" key={item.label}>
          <span className={`hz_legend_key${item.line ? ` ${item.line}` : ''}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export const HATCH_LEGEND = { label: 'Middle East conflict', line: 'hz_legend_key--hatch' };
