import ButtonShare from '@unctad-infovis/general-tools/components/ButtonShare.jsx';
import { createContext, useContext } from 'react';

/** Publication URL that the share buttons above the chart titles point to (set once in App.jsx). */
export const ShareUrl = createContext('');

export function ChartHeader({ icon, share = true, subtitle, title }) {
  const url = useContext(ShareUrl);
  return (
    <div className="chart_header">
      {share && url && <ButtonShare defaultOpen iconBg="#fff" iconColor="#000" iconHoverBg="#009edb" iconHoverColor="#fff" position="static" showLabel={false} size={30} url={url} />}
      <h3 className="chart_header_title">{title}</h3>
      {subtitle && (
        <h4 className={`chart_header_subtitle${icon ? ' chart_header_subtitle--icon' : ''}`}>
          {icon && (
            <svg aria-hidden="true" className="chart_header_icon">
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
  return <span className={`chart_header_accent${yellow ? ' chart_header_accent--yellow' : ''}`}>{children}</span>;
}

export function ChartMeta({ children, note, source }) {
  return (
    <div className="meta">
      <p className="meta_row">
        <em>Source:</em> {source}
      </p>
      {note && (
        <p className="meta_row">
          <em>Note:</em> {note}
        </p>
      )}
      {children}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <ul className="legend">
      {items.map(item => (
        <li className="legend_item" key={item.label}>
          <span className={`legend_key${item.line ? ` ${item.line}` : ''}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export const HATCH_LEGEND = { label: 'Middle East conflict', line: 'legend_key--hatch' };
