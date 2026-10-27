import Block from './Block.jsx';

/** Closing quote of the Secretary-General on the navy background, with the links to the report. */
const Arrow = () => (
  <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 16 16">
    <path d="M3 8h10m-4-4 4 4-4 4" />
  </svg>
);

export default function Footer({ full_report_url, more_reports_url, tdr_url, world_of_debt_url }) {
  return (
    <Block className="block--quote" id="fp-quote">
      <figure className="quote">
        <blockquote className="quote_text">Navigational rights are vital for the flow of food, energy and essential goods on which billions of lives depend</blockquote>
        <figcaption className="quote_caption">
          <strong className="quote_name">António Guterres</strong>Secretary-General of the United Nations
        </figcaption>
      </figure>
      <div className="quote_links">
        <a className="quote_download" href={full_report_url} rel="noopener" target="_blank">
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
          </svg>
          Download the report (PDF)
        </a>
        <a className="quote_more" href={more_reports_url} rel="noopener" target="_blank">
          More UNCTAD publications on the Strait of Hormuz
          <Arrow />
        </a>
        <a className="quote_more" href={world_of_debt_url} rel="noopener" target="_blank">
          Fiscal strains of debt-burdened economies
          <Arrow />
        </a>
        <a className="quote_more" href={tdr_url} rel="noopener" target="_blank">
          Slow down to 2.6% in 2026
          <Arrow />
        </a>
      </div>
    </Block>
  );
}
