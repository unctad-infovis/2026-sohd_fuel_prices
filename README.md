# 2026-sohd_fuel_prices

**Live demo** https://unctad-infovis.github.io/2026-sohd_fuel_prices/

## About

Interactive web version of the UN Trade and Development (UNCTAD) report on the Strait of Hormuz disruptions: "Soaring fuel prices and the burden of inflation". Rebuilt from the graphic designers' HTML/D3 prototype as a Vite + React + MDX project, structured like `../2026-sohd_storyboard` (Header, Footer, ButtonShare and the right-hand `SlideNav` are adapted from it).

Content and layout live in `src/Article.mdx`. Components are in `src/jsx/components/fuelprices/` (oil, fuels, map scrolly, tornado, tank, inflation gap, globes, tags, key considerations). All data comes from `public/assets/data/2026-sohd_fuel_prices_data.json`, loaded once by `helpers.js`.

The page is a scrollytelling minisite: a hero header, ten navigable sections (right-hand dot navigation), two full-screen statements, charts (D3), a scrolly map, and a footer with a quote and links to the full report. It is a standalone React application embeddable in UNCTAD's Drupal platform. The report itself is not yet published, so title, URLs and some copy may change.

### Status

* [x] Designer prototype ported to React components
* [ ] Replace the placeholder URLs in `src/meta.json` (`full_report_url`, `more_reports_url`, `url`), copied from the storyboard
* [ ] Final data and copy check against the report

## Implementation notes (for the next developer or AI)

### What was done
* Ported the graphic designers' prototype (`/Users/teelmo/Downloads/Hormuz_interactive_for_IT/src/{app.js,markup.html,styles.css}`, plain HTML/D3) to React components, in the structure of `../2026-sohd_storyboard`.
* Reused from the storyboard: `Header`, `Footer`, `SlideNav` (right-hand dot navigation, `slide_nav*` classes), `ButtonShare` (general-tools), `Index.jsx` (`?header=false|true` param), text sizes/colours for subtitles, source/note and body text.
* Header follows the designers' cover (bottom-left title, yellow subtitle highlight, yellow PDF button, blue gradient overlay, date top right) with the share links placed above the title.
* Chart titles are black; only the highlighted phrase uses the accent colour (`--un-color-blue-text` etc.), with the blue arrow mask from the storyboard.
* Charts: straight 5px lines, space as thousands separator, `prefers-reduced-motion` skips animations, responsive redraw on width change.

### Page structure (`src/Article.mdx`)
`Header` then `<div className="fp_container">`: `Sprite`, `SlideNav`, `Intro`, `OilChart`, `FuelsChart`, `PumpStatement`, `MapScrolly`, `TornadoChart`, `CostStatement`, `TankChart`, `GapChart`, `GlobeTrio`, `TagsChart`, `KeyConsiderations`; then `Footer`. All are registered in `src/jsx/App.jsx`.

### Files (`src/jsx/components/fuelprices/`)
* `helpers.js` – `useFuelData()` loads the single JSON once; `useWidthRedraw`, `onceVisible`, formatting helpers.
* `Block.jsx`, `ChartParts.jsx` – shared section wrapper (`.hz_block > .hz_block_inner`, `data-nav` label feeds SlideNav), titles, legends, source/note.
* One file per chart/section: `OilChart`, `FuelsChart`, `MapScrolly` (diesel map with scrolly steps), `TornadoChart` (vulnerable economies), `TankChart` (cost of a tank), `GapChart` (inflation), `GlobeTrio` (regional inflation), `TagsChart` (households), `KeyConsiderations`, `Intro`, `Statement` (`PumpStatement`, `CostStatement`).
* `Sprite.jsx` + `sprite.svg` – inline SVG symbols; must be in the same document because `url(#hz-hatch-yellow)` and `<use href="#ic-*">` need local ids.
* `FuelPrices.css` – all section styles (scoped under `#app-root-2026-sohd_fuel_prices .app`). `Header/Footer/SlideNav` `.jsx/.css` – adapted from the storyboard.
* `src/jsx/App.css` – `:root` extras and the `.fp_container` moire/gradient background.
* Data: `public/assets/data/2026-sohd_fuel_prices_data.json`. Images: `public/assets/img/2026-sohd_fuel_prices_{main,guterres,unctad_logo_white,unctad_logo_black}`.

### Gotchas
* `.app h3/h4/p` base styles from general-tools are neutralised by `.hz_block :where(h2,h3,h4,p,figure,blockquote){max-width:none;padding:0}`.
* Hero/footer background images are passed as CSS variables with an absolute URL (`new URL(..., document.baseURI)`), otherwise the relative `url()` resolves against the stylesheet and the image 404s.
* `Header.jsx` also hosts the `#hero-photo-grade` SVG filter used by `Footer.css`.
* No `!important` anywhere: the reduced-motion block in `FuelPrices.css` uses `&&` (doubled parent selector) to out-rank the section rules; the diesel icon flip is the `.hz_flip` utility class; keep descending-specificity clean by ordering rules from low to high specificity.
* Verifying with headless Chrome: `--virtual-time-budget` stalls IntersectionObserver reveals, so use real-time scrolling (CDP) to judge animations.

### Commands
`npm run start` (dev server, port 8080, assume running), `npm run build`, `npm run preview`, `npm run format`, `npm run lint:fix`, `npx biome check src`. No test framework exists.

### Header details
Hero height matches the storyboard so it fits under the UNCTAD site header: `calc(100svh - 230px)`, `calc(100svh - 340px)` at max-width 1024px, `100svh` at max-width 800px or max-height 900px. `meta.json` `title` is split so the last word goes on a second line; in `subtitle` the phrase "the burden of inflation" is highlighted yellow. Navigation labels come from `data-nav` on each `Block`.

### TODO
* Replace placeholder URLs in `src/meta.json` (copied from the storyboard) with the real report PDF, publication and "more reports" URLs.
* Check copy and data against the final report; check mobile (390px) title area of the header and nav-dot contrast over tinted blocks.
* Nothing has been committed or pushed yet.

## Content workflow

* Write text in `src/Article.mdx`, using components registered in the `components` object of `src/jsx/App.jsx`
* Put new components in `src/jsx/components/<name>/` with a co-located CSS file
* Put CSV/JSON data in `public/assets/data/` and images in `public/assets/img/`, prefixed with the project name; load them with `BasePath` and `LoadFile` from general-tools, never with hardcoded paths
* Use `__PROJECT_NAME__` (injected by Vite from `package.json`) for asset names and DOM IDs
* Scope CSS under `#app-root-2026-sohd_fuel_prices .app`, no global tag styling
* Use the `--un-*` design tokens from general-tools for colours, font sizes and weights
* Charts: straight line segments only, 5px line width, space as thousands separator (`d3.formatDefaultLocale`), source lines start with `UN Trade and Development (UNCTAD)`
* Accessibility: respect `prefers-reduced-motion`, give charts text alternatives, keyboard accessible controls
* Layout: responsive (`clamp()`/media queries), content max-width 1350px

## Code style

Biome (`npm run format`, `npm run lint:fix`): 2 space indent, 320 character line width, single quotes in JS, double quotes in JSX attributes, no trailing commas, semicolons.

## Embedding

```html
<script type="module" crossorigin="" src="https://storage.unctad.org/2026-sohd_fuel_prices/js/2026-sohd_fuel_prices.min.js?v=1"></script>
<link rel="stylesheet" crossorigin="" href="https://storage.unctad.org/2026-sohd_fuel_prices/css/2026-sohd_fuel_prices.min.css?v=1">
<div class="app-root-2026-sohd_fuel_prices" id="app-root-2026-sohd_fuel_prices">
  Loading...
</div>
<noscript>Your browser does not support Javascript!</noscript>
```

Update the `?v=` query parameter to match the current build version to bust the cache.

## Deployment

Run `npm run build` first. Then `npm run sync-gh-pages` (GitHub Pages, git subtree push) and/or `npm run sync-prod` (Azure Blob Storage via `azcopy`; needs `AZURE_STORAGE_NAME` and a prior `npm run login` with `AZURE_USER`, `AZURE_PW`, `AZURE_TENANT`). `npm run push` pushes to `origin` and `unctad`.

## Used in

* Not yet published. `src/meta.json` still points to the storyboard's publication page as a placeholder.

## Rights of usage

Contact Teemo Tebest.

## How to build and develop

This is a Vite + React project.

* `npm install`
* `npm run start`

Project should start at: http://localhost:8080

For developing please refer to `package.json`

## Files and folders

All public assets go to folder `public`.

All source code goes to folder `src`.

## Packages

The following packages are used in this project by default.

### Shared UNCTAD packages

* **@unctad-infovis/general-tools** — shared React components (`ButtonAnchor`, `ButtonShare`, `ChartDataWrapper`, `Image`, `ProgressBar`, `Quote`, `Select`, `Tooltip`, `UNCTADSiteHeader`, `BackToTop`, …), helpers (`BasePath`, `LoadFile`, `CsvToJson`, `FormatNr`, `RoundNr`, `UseIsVisible`, …) and base design-token styles

These packages are published from the [`un-init-project`](https://github.com/unctad-infovis/un-init-project) monorepo to GitHub Packages, so installing needs an `.npmrc` with `@unctad-infovis:registry=https://npm.pkg.github.com` and a `GITHUB_PACKAGES_TOKEN` environment variable.

### Project specific

* **d3** — used to create all charts, the map and the globes (scales, shapes; the globes use a hand-written orthographic projection in `GlobeTrio.jsx`, not `d3-geo`). No `topojson-client`: the map and globe geometry are inside the single data JSON
* `minisite-tools` is deliberately not used; `Header`, `Footer` and `SlideNav` are local adaptations of the storyboard versions

### Build & Dev Server

* **vite** — development server with hot module replacement and production bundler, replaces webpack
* **@vitejs/plugin-react** — adds React and JSX support to Vite

### React

* **react** — UI component library
* **react-dom** — renders React components to the DOM

### Formatter & Linter

* **@biomejs/biome** — formats and lints JS, JSX and CSS files on save, replaces ESLint + Prettier

### Minification

* **terser** — minifies the production JavaScript bundle, removes console.logs in production builds

### MDX

* **@mdx-js/rollup** — Vite/Rollup plugin that compiles MDX files into React components
* **@mdx-js/react** — provides React context for MDX components