# 2026-sohd_fuel_prices

**Live demo** https://unctad-infovis.github.io/2026-sohd_fuel_prices/

## About

Interactive web version of the UN Trade and Development (UNCTAD) report on the Strait of Hormuz disruptions: "Soaring fuel prices and the burden of inflation". Rebuilt from the graphic designers' HTML/D3 prototype as a Vite + React + MDX project, structured like `../2026-sohd_storyboard` (Header, Footer and ButtonShare are adapted from it).

Content and layout live in `src/Article.mdx`. Components are in `src/jsx/components/fuelprices/` (oil, fuels, map scrolly, tornado, tank, inflation gap, globes, tags, key considerations). All data comes from `public/assets/data/2026-sohd_fuel_prices_data.json`, loaded once by `helpers.js`.

The page is a scrollytelling minisite: a hero header, ten sections, a thin reading-progress bar, two full-screen statements, charts (D3), a scrolly map, and a footer with a quote and links to the full report. It is a standalone React application embeddable in UNCTAD's Drupal platform. The report itself is not yet published, so title, URLs and some copy may change.

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

* [Strait of Hormuz Disruptions: soaring fuel prices and the burden of inflation](https://unctad.org/publication/strait-hormuz-disruptions-soaring-fuel-prices-and-burden-inflation) – the publication page this minisite is made for.

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

* **d3** — used to create the charts and the globes (scales, shapes; the globes use a hand-written orthographic projection in `GlobeTrio.jsx`, not `d3-geo`). The globe geometry is inside the single data JSON
* **highcharts** and **@unctad-infovis/map-tools** — the official UN world map (`FuelMap.jsx`, based on the `react-vite-highcharts-map` template; topology in `public/assets/data/worldmap-economies-54030.topo.json`, copied from the `un-init-project` template, 10 June 2026 version)
* `minisite-tools` is deliberately not used; `Header` is a local adaptation of the storyboard version

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