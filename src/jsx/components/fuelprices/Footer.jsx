import basePath from '@unctad-infovis/general-tools/helpers/BasePath.js';
import './Footer.css';

export default function Footer({ full_report_url, more_reports_url }) {
  return (
    <div className="footer_container" style={{ '--footer-bg-url': `url(${new URL(`${basePath()}assets/img/2026-sohd_fuel_prices_main.jpg`, document.baseURI).href})` }}>
      <div className="footer_content">
        <div className="footer_quote_section">
          <div className="footer_photo_wrap">
            <img alt="António Guterres" className="footer_photo" src={`${basePath()}assets/img/2026-sohd_fuel_prices_guterres.jpg`} />
          </div>
          <div className="footer_quote_wrap">
            <div className="footer_quote_mark">&ldquo;</div>
            <blockquote className="footer_quote">Navigational rights are vital for the flow of food, energy and essential goods on which billions of lives depend</blockquote>
            <div className="footer_attribution">
              <span className="footer_name">António Guterres</span>
              <span className="footer_role">Secretary-General of the United Nations</span>
            </div>
          </div>
        </div>
        <div className="footer_ctas">
          <a className="footer_download_btn" href={full_report_url} rel="noopener" target="_blank">
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
            </svg>
            Download the report (PDF)
          </a>
          <a className="footer_more_link" href={more_reports_url} rel="noopener" target="_blank">
            More UNCTAD publications on the Strait of Hormuz
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 16 16">
              <path d="M3 8h10m-4-4 4 4-4 4" />
            </svg>
          </a>
        </div>
        <div className="footer_logo_wrap">
          <img alt="UN Trade and Development" className="footer_logo" src={`${basePath()}assets/img/2026-sohd_fuel_prices_unctad_logo_black.png`} />
        </div>
      </div>
    </div>
  );
}
