# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository. Interactive data story built with Vite + React + MDX + D3; content in `src/Article.mdx`, charts as React components. No test framework.

Read `README.md` first for the overview, status and content workflow; the file map, gotchas and TODOs are below.

## What was done
* Ported the graphic designers' prototype (`/Users/teelmo/Downloads/Hormuz_interactive_for_IT/src/{app.js,markup.html,styles.css}`, plain HTML/D3) to React components, in the structure of `../2026-sohd_storyboard`.
* Reused from the storyboard: `Header`, `Footer`, `SlideNav` (right-hand dot navigation, `slide_nav*` classes), `ButtonShare` (general-tools), `Index.jsx` (`?header=false|true` param), text sizes/colours for subtitles, source/note and body text.
* Header follows the designers' cover (bottom-left title, yellow subtitle highlight, yellow PDF button, blue gradient overlay, date top right) with the share links placed above the title.
* Chart titles are black; only the highlighted phrase uses the accent colour (`--un-color-blue-text` etc.), with the blue arrow mask from the storyboard.
* Charts: straight 5px lines, space as thousands separator, `prefers-reduced-motion` skips animations, responsive redraw on width change.

## Page structure (`src/Article.mdx`)
`Header` then `<div className="fp_container">`: `Sprite`, `ProgressBar` (3px reading progress, sticky at the top of the viewport), `SlideNav`, `Intro`, `OilChart`, `FuelsChart`, `PumpStatement`, `MapScrolly`, `TornadoChart`, `CostStatement`, `TankChart`, `GapChart`, `GlobeTrio`, `TagsChart`, `KeyConsiderations`; then `Footer`. All are registered in `src/jsx/App.jsx`.

## Files (`src/jsx/components/fuelprices/`)
* `helpers.js` – `useFuelData()` loads the single JSON once; `useWidthRedraw`, `onceVisible`, formatting helpers.
* `Block.jsx`, `ChartParts.jsx` – shared section wrapper (`.block > .block_inner`, `data-nav` label feeds SlideNav), titles, legends, source/note.
* One file per chart/section: `OilChart`, `FuelsChart`, `MapScrolly` (scrolly steps) with `MapFind` (search and result box) and `FuelMap` (official UN map: Highcharts + map-tools; only economies above the 20% threshold are highlighted), `TornadoChart` (vulnerable economies), `TankChart` (cost of a tank), `GapChart` (inflation), `GlobeTrio` (regional inflation), `TagsChart` (households), `KeyConsiderations`, `Intro`, `Statement` (`PumpStatement`, `CostStatement`).
* `Sprite.jsx` + `sprite.svg` – inline SVG symbols; must be in the same document because `url(#fp-hatch-yellow)` and `<use href="#ic-*">` need local ids.
* `FuelPrices.css` – all section styles (scoped under `#app-root-2026-sohd_fuel_prices .app`). `Header/SlideNav` `.jsx/.css` – adapted from the storyboard. `Footer.jsx` is the designers' text-only quote block (`.block--quote`, navy with the moire overlay shared with the intro) plus the report links (download, more publications, World of Debt, Trade and Development Report; URLs in `meta.json`); its styles live in `FuelPrices.css`.
* `src/jsx/App.css` – design-token extras only. The moire/gradient page background lives once on `.app` (one viewport-sized `position: fixed` `::before` with lines and wash; no `background-attachment: fixed`, no page-tall layer, both gave artefacts; `.app` has `clip-path: inset(0)` so the fixed layer does not paint over the dev site header) in `FuelPrices.css`; do not repaint it on `.fp_container` (that doubled the lines and made the page noisier than the storyboard).
* Data: `public/assets/data/2026-sohd_fuel_prices_data.json`. Images: `public/assets/img/2026-sohd_fuel_prices_{main,unctad_logo_white}`.

## Gotchas
* `.app h3/h4/p` base styles from general-tools are neutralised by `.block :where(h2,h3,h4,p,figure,blockquote){max-width:none;padding:0}`.
* The hero background image is passed as CSS variables with an absolute URL (`new URL(..., document.baseURI)`), otherwise the relative `url()` resolves against the stylesheet and the image 404s.
* `Header.jsx` also hosts the `#hero-photo-grade` SVG filter used by `Header.css`.
* No `!important` anywhere: the reduced-motion block in `FuelPrices.css` uses `&&` (doubled parent selector) to out-rank the section rules; the diesel icon flip is the `.flip` utility class; keep descending-specificity clean by ordering rules from low to high specificity.
* Verifying with headless Chrome: `--virtual-time-budget` stalls IntersectionObserver reveals, so use real-time scrolling (CDP) to judge animations.

## Commands
`npm run start` (dev server, port 8080, assume running), `npm run build`, `npm run format`, `npx biome check src`.

## TODO
* `src/meta.json`: report PDF, publication page and "more reports" URLs are final; the report PDF and publication page are not live yet (unpublished), so they return an error until UNCTAD publishes them.
* Check copy and data against the final report; check mobile (390px) title area of the header and nav-dot contrast over tinted blocks.

## Rules for this project
* No em dashes in text; use en dashes.
* Do not start the dev server (assume localhost:8080 is running); for checks use a temporary `vite preview` and kill it afterwards.
* Commits: no AI co-author trailer; commit to the current branch and push to every remote (`origin` and `unctad`), preferably `npm run push`.
* CSS class names have no project prefix; every rule lives under `#app-root-2026-sohd_fuel_prices .app` (no `:root`, `html` or `body` rules) and DOM queries in JS start at that root. Only names that are global by nature carry the `fp-` prefix: `@keyframes`, SVG ids and custom properties (`--fp-*`). The chart title block is `chart_header*` because `header_*` belongs to the hero.
* Reuse storyboard/general-tools components before writing new ones; scope CSS under `#app-root-2026-sohd_fuel_prices .app`; CSS properties alphabetical, nested rules; use `--un-*` tokens only.
* Source lines start with "UN Trade and Development (UNCTAD)".
* Chart subtitles end with a full stop (the titles do). Axis labels use `--un-color-grey-darkest`; x-axis years are bold. The conflict annotation text comes from `conflictLabel` in `helpers.js`.
* Map colours (`mapClasses.js`, from the designers' second mockup): five classes, two blues up to 20% then yellow, orange and red above it, hatched stripes for no data; the big number and the fuel word in the step text use the same yellow-to-red gradient (`.maps_big`, `.maps_hl`). `MapFind.jsx` is the "Find an economy" search with a result box (outlines the economy on the map via `foundCode` in `FuelMap.jsx`).
* Slide-by-slide review: log every agreed change in `tmp/review-changes.md` (git-ignored) so it can be summarised for colleagues by email after the review.
* Chart slides: the title arrow hangs left of the content. `--fp-indent` (45px, 0 below 600px) is the left margin of `.chart`, `.legend`, `.insight`, `.caption`, `.meta`, `.tank`, `.globes` and `.keys`, so everything lines up with the title text.

## Commands
```bash
npm run start      # dev server, http://localhost:8080 (assume already running)
npm run build      # production build to dist/ (delete dist/ afterwards if only verifying)
npm run preview    # preview the build
npm run format     # Biome format (run after edits)
npm run lint:fix   # Biome lint + fix
```

## Code style (Biome)
2 spaces, 320-column line width, single quotes in JS, double quotes in JSX attributes, no trailing commas, semicolons.

## Architecture
* `__PROJECT_NAME__` is Vite-injected from `package.json` name; use it for asset names and DOM IDs.
* Never hardcode asset paths; use general-tools `BasePath` (unctad.org gives Azure paths, localhost relative, otherwise GitHub Pages).
* Dependencies: `@unctad-infovis/general-tools`, `@unctad-infovis/map-tools`, `highcharts` (official UN map only) and `d3` (no minisite-tools, no topojson-client).

## Deployment
| Target | Command | Requires |
|--------|---------|---------|
| GitHub Pages | `npm run sync-gh-pages` | git subtree push; `unctad` remote |
| Azure Blob Storage | `npm run sync-prod` | `azcopy`, `AZURE_STORAGE_NAME`, prior `npm run login` (`AZURE_USER`, `AZURE_PW`, `AZURE_TENANT`) |

Run `npm run build` first. `npm run push` pushes to `origin` and `unctad`.

## Header
Hero height matches the storyboard (`calc(100svh - 230px)`; `-340px` at max-width 1024px; `100svh` at max-width 800px or max-height 900px) so it fits under the UNCTAD site header. Last word of `meta.json` title goes on line two; "the burden of inflation" in the subtitle is yellow. Nav labels come from `data-nav` on `Block`.
