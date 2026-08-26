# fpl-frontend

Next.js 16 App Router UI for the FPL AI manager. A typed shell over the NestJS backend in
`../fpl-backend` (:5001), which owns all data and every business rule. Runs on **:5000**.

TypeScript, Tailwind v4, `@/` resolves to `src/`. `pnpm dev` serves on :5000.

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
  derived numbers, and a stale projection presented as live is its worst failure mode.
- **Deadlines arrive as UTC.** Render in the user's local zone with the zone named. A deadline shown
  in the wrong zone is the one bug here that costs the user actual points.
- **Port 5000 is contested on macOS.** AirPlay Receiver binds it and the dev server will not start —
  System Settings → General → AirDrop & Handoff → AirPlay Receiver → Off. The error Next prints does
  not say this.
- **Per-route JS budget is 150 KB gzipped.** A charting library in the initial bundle blows it alone;
  render charts on the server or load them lazily.

## Layering

Server component → (if interactive) client component → TanStack Query hook → api function →
`apiClient`. Data never skips a layer. Feature slices live in `src/features/<feature>/` with
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
