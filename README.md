# Tidepost Strategy Game

An original offline browser strategy game with deterministic turns, three campaign missions, and save and replay.

Only a runnable scaffold exists; the game itself is planned. The scope, architecture and acceptance criteria are in [the project plan](docs/PROJECT-PLAN.md). The plan includes a reproducible verification strategy for the future build.

- [Product requirements](docs/PROJECT-PLAN.md#product-requirements)
- [Technical design](docs/PROJECT-PLAN.md#technical-design)
- [Implementation backlog and epic](https://github.com/jortega0033/tidepost-strategy-game/issues)

The first plan of phase 1 said 20–31 engineering hours. Its open tickets, with tests and review, add up to 54 to 82 hours; the whole program is larger and is described below. All figures are estimates.

## Program goal

Build Tidepost into a full original strategy game and the engine under it: a simulated living coast, a long campaign, opponents that plan, online play in lockstep, and tools for players to make and prove their own missions.

The program is planned ([#35](https://github.com/jortega0033/tidepost-strategy-game/issues/35)). Phase 1 is the current epic [#1](https://github.com/jortega0033/tidepost-strategy-game/issues/1) and the only phase with tickets.

**Score.** Two numbers: opponent strength as rating over fixed baseline players on 1,000 seeded missions, and the share of missions with a machine-proven fair solution.

| Phase | Content | Hours (rough) | Issue |
|---|---|---|---|
| 1 | The current epic and its tickets | 54 to 82 | [#1](https://github.com/jortega0033/tidepost-strategy-game/issues/1) |
| 2 | Living world | 110 to 180 | [#36](https://github.com/jortega0033/tidepost-strategy-game/issues/36) |
| 3 | Opponents that plan | 130 to 230 | [#37](https://github.com/jortega0033/tidepost-strategy-game/issues/37) |
| 4 | Campaign | 120 to 200 | [#38](https://github.com/jortega0033/tidepost-strategy-game/issues/38) |
| 5 | Multiplayer | 100 to 170 | [#39](https://github.com/jortega0033/tidepost-strategy-game/issues/39) |
| 6 | Creation | 130 to 220 | [#40](https://github.com/jortega0033/tidepost-strategy-game/issues/40) |

About 640 to 1080 engineer hours in total: rough estimates, not measurements. The numbers in the score and the finish lines are targets until a run shows them. Only phase 1 has tickets to work; the sub-issues of a later phase are written when it starts. No single session is expected to reach the end.

## License

[MIT](LICENSE) © 2026 Jake Ortega.
