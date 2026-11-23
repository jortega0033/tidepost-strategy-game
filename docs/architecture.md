# Implementer map

Status: **only the scaffold exists, no product behaviour.** This page maps the boundaries that [PROJECT-PLAN.md](PROJECT-PLAN.md) requires onto a module layout so that parallel tickets do not collide. It adds no requirement; the plan wins where they differ. The names are the orchestrator's proposal, fixed by the scaffold; a ticket that changes one corrects this page in the same pull request.

## Planned module map

| Boundary | Module | Owns | Parent ticket |
|---|---|---|---|
| Turn engine | `src/engine/` | Scenario, order, state and event types, validation, tick phases | #2 |
| Canonical state | `src/engine/canonical.ts` | Key order, serialisation, SHA-256 | #5 |
| Rival and goals | `src/rival/` | Policy, reservations, shortest paths, goal evaluation | #3 |
| Missions | `src/missions/` | Three frozen scenario definitions and briefings | #6 |
| Storage and replay | `src/storage/` | IndexedDB slot, campaign progress, export, import, replay | #5 |
| Page | `src/ui/ and public/` | Board, controls, log, help, replay viewer | #4, #6 |
| Local server | `scripts/serve.mjs` | Static files on one stable loopback origin | #7 (a first version with the scaffold) |
| Build step | `scripts/build.mjs`, `package.json` | Copies `public/` into `dist/` after `tsc` | #7 (a first version with the scaffold) |
| Shared stub | `src/not-implemented.ts` | Message for features not built yet; removed with its last use | #6 |
| CI | `.github/workflows/ci.yml` | Hook and test jobs, Chrome step | #5 (a first version with the scaffold) |
| Player and release documents | `README.md`, `docs/PLAYING.md`, `docs/release-verification.md`, `docs/RELEASING.md` | Launch, controls, limits, goals, recorded results | #7 |
| Map and freeze points | `docs/architecture.md` | This page | every ticket |
| Tests | `test/` | `node --test` on the compiled modules | every ticket |

Dependency direction: `rival`, `missions` and `storage` depend on `engine` types; `ui` depends on all of them; `engine` imports nothing from the app.

## Freeze points

Parallel tickets rely on these shapes. A ticket that changes a frozen shape updates this page and every dependent ticket in the same pull request.

- **Scenario, order, state and event contracts**: ticket #2 freezes them before #3, #4 and #5 start.
- **Save and replay record version 1**: ticket #5.
- **Scenario definitions and their digests**: ticket #6, frozen before fixture digests are recorded.

## What is verified where

Engine, rival, missions and canonical state run under `node --test` locally and in CI on Linux and Windows. IndexedDB, keyboard and offline checks run in Chrome, headless over the DevTools pipe without a dependency or by hand; the pull request says which, with the Chrome version.
