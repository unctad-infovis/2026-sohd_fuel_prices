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
`Header` then `<div className="fp_container">`: `Sprite`, `SlideNav`, `Intro`, `OilChart`, `FuelsChart`, `PumpStatement`, `MapScrolly`, `TornadoChart`, `CostStatement`, `TankChart`, `GapChart`, `GlobeTrio`, `TagsChart`, `KeyConsiderations`; then `Footer`. All are registered in `src/jsx/App.jsx`.

## Files (`src/jsx/components/fuelprices/`)
* `helpers.js` – `useFuelData()` loads the single JSON once; `useWidthRedraw`, `onceVisible`, formatting helpers.
* `Block.jsx`, `ChartParts.jsx` – shared section wrapper (`.hz_block > .hz_block_inner`, `data-nav` label feeds SlideNav), titles, legends, source/note.
* One file per chart/section: `OilChart`, `FuelsChart`, `MapScrolly` (diesel map with scrolly steps), `TornadoChart` (vulnerable economies), `TankChart` (cost of a tank), `GapChart` (inflation), `GlobeTrio` (regional inflation), `TagsChart` (households), `KeyConsiderations`, `Intro`, `Statement` (`PumpStatement`, `CostStatement`).
* `Sprite.jsx` + `sprite.svg` – inline SVG symbols; must be in the same document because `url(#hz-hatch-yellow)` and `<use href="#ic-*">` need local ids.
* `FuelPrices.css` – all section styles (scoped under `#app-root-2026-sohd_fuel_prices .app`). `Header/Footer/SlideNav` `.jsx/.css` – adapted from the storyboard.
* `src/jsx/App.css` – `:root` extras and the `.fp_container` moire/gradient background.
* Data: `public/assets/data/2026-sohd_fuel_prices_data.json`. Images: `public/assets/img/2026-sohd_fuel_prices_{main,guterres,unctad_logo_white,unctad_logo_black}`.

## Gotchas
* `.app h3/h4/p` base styles from general-tools are neutralised by `.hz_block :where(h2,h3,h4,p,figure,blockquote){max-width:none;padding:0}`.
* Hero/footer background images are passed as CSS variables with an absolute URL (`new URL(..., document.baseURI)`), otherwise the relative `url()` resolves against the stylesheet and the image 404s.
* `Header.jsx` also hosts the `#hero-photo-grade` SVG filter used by `Footer.css`.
* No `!important` anywhere: the reduced-motion block in `FuelPrices.css` uses `&&` (doubled parent selector) to out-rank the section rules; the diesel icon flip is the `.hz_flip` utility class; keep descending-specificity clean by ordering rules from low to high specificity.
* Verifying with headless Chrome: `--virtual-time-budget` stalls IntersectionObserver reveals, so use real-time scrolling (CDP) to judge animations.

## Commands
`npm run start` (dev server, port 8080, assume running), `npm run build`, `npm run format`, `npx biome check src`.

## TODO
* Replace placeholder URLs in `src/meta.json` (copied from the storyboard) with the real report PDF, publication and "more reports" URLs.
* Check copy and data against the final report; check mobile (390px) title area of the header and nav-dot contrast over tinted blocks.
* Nothing has been committed or pushed yet.

## Rules for this project
* No em dashes in text; use en dashes.
* Do not start the dev server (assume localhost:8080 is running); for checks use a temporary `vite preview` and kill it afterwards.
* Commits: no AI co-author trailer; commit to the current branch and push to every remote (`origin` and `unctad`), preferably `npm run push`.
* Reuse storyboard/general-tools components before writing new ones; scope CSS under `#app-root-2026-sohd_fuel_prices .app`; CSS properties alphabetical, nested rules; use `--un-*` tokens only.
* Source lines start with "UN Trade and Development (UNCTAD)".

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
* Dependencies: `@unctad-infovis/general-tools` and `d3` only (no minisite-tools, no topojson-client).

## Deployment
| Target | Command | Requires |
|--------|---------|---------|
| GitHub Pages | `npm run sync-gh-pages` | git subtree push; `unctad` remote |
| Azure Blob Storage | `npm run sync-prod` | `azcopy`, `AZURE_STORAGE_NAME`, prior `npm run login` (`AZURE_USER`, `AZURE_PW`, `AZURE_TENANT`) |

Run `npm run build` first. `npm run push` pushes to `origin` and `unctad`.

## Header
Hero height matches the storyboard (`calc(100svh - 230px)`; `-340px` at max-width 1024px; `100svh` at max-width 800px or max-height 900px) so it fits under the UNCTAD site header. Last word of `meta.json` title goes on line two; "the burden of inflation" in the subtitle is yellow. Nav labels come from `data-nav` on `Block`.
