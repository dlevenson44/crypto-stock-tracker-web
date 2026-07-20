# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Uses **pnpm** (pnpm-lock.yaml is checked in).

- `pnpm dev` — start dev server (Vite, port 3000)
- `pnpm build` — typecheck (`tsc -b`) then build with Vite
- `pnpm lint` — run ESLint (flat config, `eslint.config.js`)
- `pnpm preview` — preview production build

No test framework is set up yet.

## Architecture

Guild website for Four Loktar (Horde, Dreamscythe): Vite + React 19 + TypeScript SPA with React Router and TanStack Query, backed by Supabase (Postgres + RLS, Discord OAuth, Edge Functions). App entry HTML is `index.html` at the repo root.

- **Dual-mode data layer**: `src/lib/api.ts` is the only data access point. With `VITE_SUPABASE_*` env vars set it queries Supabase; without them it serves an in-memory copy of `src/lib/mock/data.ts` (the app must always work in mock mode).
- **Auth**: `src/lib/auth.tsx` — real Discord OAuth via Supabase, or simulated member/officer login in mock mode. Officer role comes from the `profiles` table and gates `/admin` plus sync buttons.
- **Pages** in `src/pages/`, shared layout in `src/components/Layout.tsx`, domain types in `src/lib/types.ts`, WoW constants (classes, roles, custom guild ranks — exact casing matters) in `src/lib/wow.ts`.
- **Backend**: SQL migrations in `supabase/migrations/` (schema + RLS policies); Deno edge functions in `supabase/functions/` (`wcl-parses`, `raidhelper-sync`) — excluded from ESLint and tsc; setup/deploy steps in `SETUP.md`.

- Path alias: `~/*` maps to `./src/*` (tsconfig).
- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters` and `verbatimModuleSyntax` — type-only imports must use `import type` / inline `type` specifiers (also enforced by the `@typescript-eslint/consistent-type-imports` lint rule).
- `tsc` does not emit; Vite handles bundling.

## Code style

Prettier is enforced through ESLint (`prettier/prettier: error`): no semicolons, single quotes, 80-char lines. Other enforced conventions:

- Import order (`import-x/order`): builtin → external → internal → parent → sibling → index, alphabetized, blank line between groups, with `react` always first.
- No `console.log` (only `console.warn`/`console.error`).
- JSX: no curly braces around string props/children, self-closing components required, jsx-a11y rules active.
