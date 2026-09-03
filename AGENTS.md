# fpl-frontend

Next.js 16 App Router UI for the FPL AI manager. A typed shell over the NestJS backend in
`../fpl-backend` (:5001), which owns all data and every business rule. Runs on **:4000**.

TypeScript, Tailwind v4, `@/` resolves to `src/`. `pnpm dev` serves on :4000.

## Non-obvious constraints

Things a fresh read of the code will not tell you, and that are expensive to get wrong:

- **This app never calls `fantasy.premierleague.com`.** Not from a server component, not from the
  browser, not for a badge image. A fetch to any `premierleague.com` host under `src/` is a review
  failure: the upstream payload is 1.6 MB with no SLA, and the projections that are the point of the
  app exist only in our backend.
- **`fetch` is confined to `src/lib/api/`.** A stray fetch in a component skips the envelope unwrap,
  the error normalization and the request-id propagation.
- **Server components are the default.** `'use client'` only where state, an effect or a browser API
  is genuinely needed — a `'use client'` at the top of a page pulls the whole tree into the bundle,
  and shipping the static half as HTML is most of where "fast" comes from here.
- **`src/lib/api/types.gen.ts` is generated** from the backend's OpenAPI document by
  `pnpm generate:api`. Hand-editing it is exactly how the two repos drift, and the drift shows up as
  a runtime `undefined` rather than a type error.
- **Money arrives in tenths.** `55` is £5.5m. Format at the render edge only; never do arithmetic on
  a formatted string.
- **Anything showing model output must show `meta.dataAsOfGw` and `generatedAt`.** This app renders
  derived numbers, and a stale projection presented as live is its worst failure mode. Fetch through
  **`apiFetchWithMeta`** and render `<Provenance>`. `apiFetch` returns the data alone and is for
  calls whose view shows nothing derived — it discarded the envelope's `meta` for every view until
  B-009 (D-019), which is how the rule above went unmet while being written down.
- **Times arrive as UTC and a server component formats in the server's zone, not the reader's.**
  Ship UTC in the HTML and swap to the local zone in `<LocalTime>`, the one client leaf for it. No
  DTO carries a deadline today, so nothing renders one.
- **The port is 4000, and it is chosen, not incidental.** 5000 was the original choice and macOS
  AirPlay Receiver binds it by default, so the dev server never started. The port of record is
  `ports["fpl-frontend"]` in `../fpl-orchestrator/orchestration/repos.json`; `package.json` must
  agree with it. If a dev server ever fails with `EADDRINUSE`, check who holds the port
  (`lsof -nP -i :4000`) before assuming an application error — the message Next prints does not name
  the holder.
- **The JS budget is feature JS: the route total minus the framework floor.** The floor is 172.9 KB
  gzipped (`fpl-performance-budget`), the budget above it is 30 KB. On 2026-09-03, with the player
  sheet, the theme toggle and the bottom navigation on every route, the routes measured 3.4 KB (`/`),
  10.0 KB (`/squad/recommended` and `/squad/<id>`) and 16.8 KB (`/squad/build`). A charting library
  would spend the lot on its own; the bars and meters here are `div`s.
- **Tapping a player anywhere opens the player sheet** (plan 030): `PlayerSheetProvider` is mounted
  once per view, `PlayerTrigger` is the client leaf that wraps server-rendered markup, and the sheet
  fetches `GET /api/players/{id}` on open through `getPlayerDetail` with a per-page `Map` cache. No
  TanStack Query — it is not installed, and the cache is the right size for one fetch per tap. A new
  place that shows a player's name wraps it in `PlayerTrigger`; outside a provider the trigger renders
  its children unwrapped.
- **The colour scheme has three states**, not two: nothing stored (follow the system), `light`, `dark`.
  An inline script in `layout.tsx` stamps `data-theme` before first paint, so `<html>` carries
  `suppressHydrationWarning`, and the dark tokens in `globals.css` are declared twice — under the
  media query guarded by `:root:not([data-theme="light"])` and under `:root[data-theme="dark"]`. Keep
  the two blocks identical. Anything that reads the browser (theme, the remembered team ids) goes
  through `useSyncExternalStore` with a server snapshot, never an effect that sets state.

## The design system

Tokens live in `src/app/globals.css` and **nothing outside it names a colour**. Components wear
`bg-surface`, `text-ink-2`, `border-line`, not `zinc-800` — the two schemes differ by more than a
lightness flip, so a raw palette class is a dark-mode bug that only shows up in dark mode. Shared
primitives are in `src/components/ui/` (`Card`, `Stat`, `Badge`, `PositionChip`, `Meter`, `Bar`,
`Note`, `Provenance`, `buttonClass`); reach for one before writing a bordered `div`.

The four position hues are **validated, not chosen**: the `dataviz` validator on both surfaces with
`--pairs all`, recorded in the comment above the tokens. They pass only with the position also
written in text beside the colour, so **no position may be signalled by colour alone**, and the
validator is re-run before any of those six values changes (D-019).

## Layering

Server component → (if interactive) client component → api function → `apiClient`. Data never
skips a layer. (The contract names a TanStack Query hook between the two; it is not installed and
nothing here has needed it yet — the builder and the player sheet call the api functions directly.) Feature slices live in `src/features/<feature>/` with
`api/`, `hooks/`, `components/`, `schemas/`, `types/`, `utils/`. A feature does not import another
feature's internals; shared code goes to `src/lib/`, `src/components/`, `src/hooks/`.

## Where the depth lives

Fourteen skills, symlinked into `.claude/skills/` from `../fpl-orchestrator/skills/`. Each states its
own triggers; load the matching one **before** acting. Do not restate skill content here — when
reality and a skill disagree, fix the skill.

The ones that bite most often here: `fpl-architecture-contract`, `fpl-performance-budget`,
`fpl-domain-rules`.

If `.claude/skills/` is empty or full of dangling links, run
`bash ../fpl-orchestrator/scripts/link-skills.sh` — symlinks are machine-local and not committed.

`/new-feature` is mandatory before writing code for anything touching more than one file.

## Change flow

Plan file in `../fpl-orchestrator/docs/plans/` → branch → implement → `pnpm typecheck && pnpm lint`
→ verify by loading the page and seeing the data render → conventional commit. Never add AI/Claude
`Co-Authored-By` trailers. Full loop and evidence bar:
`../fpl-orchestrator/orchestration/workflow.md`.

## Docs of record

**`AGENTS.md` is the real file; `CLAUDE.md` is a symlink to it.** Same inode, so they cannot drift.
Edit `AGENTS.md`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
