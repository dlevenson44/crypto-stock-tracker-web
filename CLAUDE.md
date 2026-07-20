# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Uses **pnpm** (pnpm-lock.yaml is checked in).

- `pnpm dev` — start dev server (Vite, port 3000)
- `pnpm build` — typecheck (`tsc -b`) then build with Vite
- `pnpm lint` — run ESLint (flat config, `eslint.config.js`)
- `pnpm lint:fix` — ESLint with `--fix`
- `pnpm preview` — preview production build

No test framework is set up yet.

## Architecture

Single-ticker crypto & stock tracker: Vite + React 19 + TypeScript SPA that
charts price and volume history from the [Twelve Data](https://twelvedata.com)
API. App entry HTML is `index.html` at the repo root; `src/App.tsx` holds all
top-level state (selected ticker, range, fetched series, loading/error).

- **Data layer**: `src/lib/api.ts` is the only data access point — `searchSymbols`
  (ticker autocomplete) and `fetchChart` (time series). Both call the API through
  the `/td` path prefix. `fetchChart` keeps an in-memory cache keyed by
  `symbol:range` with a 60s TTL. Newest-first responses are reversed and mapped to
  `PricePoint[]`.
- **API proxy & key**: requests go to `/td/*`. In dev, `vite.config.ts` proxies
  them to `https://api.twelvedata.com`; in production the Vercel Edge function
  `api/td/[...path].ts` (routed via `vercel.json`) does the same. Both authenticate
  by injecting the `TWELVE_DATA_API_KEY` env var as an `Authorization: apikey …`
  header. The key is intentionally **not** `VITE_`-prefixed so it stays server-side
  and never reaches the browser. Locally, put it in a gitignored `.env` at the repo
  root; on Vercel, set it in the project's environment variables. Note `vite
  preview` does not run the dev proxy, so `/td` requests only work under `pnpm dev`
  or a real Vercel deploy.
- **Charts**: Chart.js is tree-shaken — the needed controllers/elements are
  registered once in `src/lib/charts.ts` (imported for side effects from
  `src/main.tsx`). `PriceChart` (line) and `VolumeChart` (bar) wrap
  `react-chartjs-2`; the volume card only renders when the series has non-zero
  volume. `src/lib/chartTheme.ts` (`useChartTheme`) supplies light/dark colors that
  track `prefers-color-scheme`.
- **Formatting**: `src/lib/format.ts` centralizes `Intl`-based price/percent/compact
  and per-range axis/tooltip date formatting.
- **Types**: `src/lib/types.ts` — `AssetType`, `RangeKey`, the `RANGE_OPTIONS` list,
  `SearchResult`, `PricePoint`, `ChartSeries`.
- **Components** (`src/components/`): `SearchBar` (debounced, abortable combobox with
  keyboard nav), `RangeTabs`, `StatsRow`, `PriceChart`, `VolumeChart`.

- Path alias: `~/*` maps to `./src/*` (tsconfig + `vite.config.ts` resolve.alias).
- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters` and
  `verbatimModuleSyntax` — type-only imports must use `import type` / inline `type`
  specifiers (also enforced by the `@typescript-eslint/consistent-type-imports` lint
  rule).
- `tsc` does not emit; Vite handles bundling.

## Code style

Prettier is enforced through ESLint (`prettier/prettier: error`): no semicolons, single quotes, 80-char lines. Other enforced conventions:

- Import order (`import-x/order`): builtin → external → internal → parent → sibling → index, alphabetized, blank line between groups, with `react` always first.
- No `console.log` (only `console.warn`/`console.error`).
- JSX: no curly braces around string props/children, self-closing components required, jsx-a11y rules active.
