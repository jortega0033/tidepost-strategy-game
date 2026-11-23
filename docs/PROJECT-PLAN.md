# Tidepost Strategy Game

## Product requirements

Tidepost is an original, offline, single-player strategy game for desktop Chrome. After a spring surge breaks a chain of causeways, a volunteer repair crew must move supplies, install tideposts and reopen safe routes. A second crew competes for the same supply caches and build sites. The player directs a crew or pair of crews on a grid, checks the pending orders and advances the turn when ready.

A player should understand which tiles a crew can reach, why an order was blocked and how their next action moves the mission forward. Every mission starts from a fixed scenario and supports a local retry. The same starting state and accepted player orders must produce the same visible outcome on every replay.

| Area | First playable scope |
|---|---|
| Campaign | Three playable missions with short briefings and fixed scenarios. A player can retry an unlocked mission without resetting campaign progress. |
| Strategy | Cardinal movement, contested supplies, up to three fixed build sites and one deterministic rival controller. Up to two crews per controller. |
| Mission goals | Outbuild the rival, reserve supplies while reopening a route, and manage two competing build sites. |
| Interface | An original paper-chart grid using CSS shapes, geometric icons and text. Objectives, crews, orders, materials and turn outcomes have text labels. All visuals are authored for Tidepost. |
| Persistence | One local active-run slot, a safe Continue path and a read-only replay viewer with local export/import. |
| Offline | Ship a static package and local launch instructions. All runtime assets, mission text and controls are bundled. |

The first release defers multiplayer, additional autonomous participants, terrain editors, combat, generated maps, cloud saves, third-party assets and controller input. The 15-mission campaign is a roadmap. Missions 4–7 introduce route pressure and terrain variety. Missions 8–11 explore additional controllers and objectives after the two-controller rules hold up. Missions 12–15 combine established mechanics into longer scenarios after accessibility and replay checks pass. Additional participants and larger boards require a separate performance and design plan.

### Player stories and success criteria

| Story | Expected evidence |
|---|---|
| As a new player, I can read the objective, select a crew and advance one turn. | Complete the first move with a pointer and then with a keyboard. The board identifies the crew, pending order, remaining turns and current goal. |
| As a player planning a route, I can see terrain, material costs and the reasons my orders were blocked. | A contested move has a readable outcome. Material and post counters match the board and turn log. |
| As a returning player, I can reopen Chrome, resume a valid run and replay its turns. | Continue restores the last fully saved turn. A replay reaches the same final checksum and supports per-turn navigation. |
| As an offline player, I can finish and retry the campaign. | A fresh browser profile loads the static package from loopback with all external web access blocked. The campaign and persistence remain usable. |

## Technical design

### Runtime and boundaries

Use TypeScript with strict type checking and a static browser application. Bundle the runtime with relative asset URLs and include a local serve command with a stable localhost origin and port, since local data is stored per origin. Development tooling may require an initial install. Runtime play needs no login, analytics, remote fonts or service API.

Split the project into a pure turn engine, authored mission records, a rival policy, a browser UI adapter and a storage/replay adapter. The engine accepts a scenario or validated prior state and player orders, then emits a new state and structured events. Rendering, input timing and animation never advance a turn. The controller permits one pending Advance action during a save and ignores repeated keydown events so holding the key cannot apply a turn twice.

### Board, orders and phase rules

- Grid coordinates use integers from zero, with the origin at top-left and boards up to 12 × 12. Crews have unique positive integer IDs and occupy distinct tiles. Sort crews ascending by ID across controllers. A run starts at tick 0 with a nonzero unsigned 32-bit scenario seed. Stock and site reserves are nonnegative integers capped at 99.
- Each controller can submit one order per crew for a tick. Orders are Wait, Move one cardinal tile, Collect from the current tile, or Build on the current tile. Missing orders mean Wait. Duplicate orders, foreign crew IDs and structurally malformed input reject the turn before state mutation. Legal orders blocked by the board produce blocked events.
- Set terrain from the gate schedule at the start of the tick. Freeze terrain and occupied tiles for rival navigation and move resolution. Destinations outside the grid, water, closed gates and occupied tiles are blocked. Crews may leave a gate that closes under them. Movement into a tile vacated on the same tick, swaps and movement chains are blocked. Among candidates for the same free tile, the lower crew ID wins. Apply successful moves together.
- Then resolve Collect and Build in ascending crew ID order. Collect transfers up to two units from the local finite reserve to the controller's stock, with stock capped at 99. Build costs four stock and requires an unclaimed site. A blocked action changes no stock. A later action sees material changes from prior actions. Crews that moved must wait for the next tick to collect or build.
- Evaluate goals after all actions. Check the explicit loss condition first if both goals are simultaneously true. If neither condition fires and the resulting tick equals the budget, record a timeout loss. A terminal run rejects further advances. Emit events by phase, then by crew ID within each phase. The summary shows tick, material stocks, cache reserves and post ownership.

### Deterministic rival

The rival reads the frozen start-of-tick board. A crew on an unclaimed site builds if its controller has at least four unreserved stock. Otherwise a crew on a nonempty cache collects if there is room. For movement, pursue reachable free build sites when stock can cover the building cost. If no such site is reachable or affordable, pursue reachable caches when stock has room. Use shortest cardinal paths with N, E, S, W neighbor expansion and treat other crews as obstacles. If all candidates are blocked, Wait.

Choose between equally distant objective tiles by row and then column. Process rival crews in ascending crew ID order. Reserve stock for builds and reserve selected first steps and objective tiles for the current turn's policy call. Reservations do not modify live state. Human and rival clashes still resolve by crew ID. Each mission defines its seed (1, 2 and 3 in campaign order). The initial rules consume no random draws. Future authored variations can adopt an explicit uint32 xorshift32 variant only through a versioned scenario contract and a recorded seed.

### Save and replay contracts

Persist a schema version, scenario ID and definition digest, engine version, seed, last completed tick, status, typed human order log and end-state digest. Store campaign progress separately as a set of known mission IDs. Use one IndexedDB transaction per active-run replace and include the unlock update in the same transaction upon a first win. On failure, keep the run in memory and show the last confirmed saved tick. Continue checks the stored shape and regenerates each rival decision and all turns, then compares tick, status and digest before replacing live state.

Bound log length to the scenario budget and import size to 256 KiB. Support only recognized schema and engine versions. Validate imported JSON keys, all types and numeric bounds, the scenario digest and crew IDs before simulation. Caps include 144 tiles, four crew IDs and two human orders per tick. Reject orders after a terminal outcome. An imported replay stays in the read-only viewer and cannot unlock missions or replace an active run.

Compute SHA-256 over UTF-8 canonical JSON bytes. Project state with an explicit schema-versioned key order, terrain in row-major order, crews and controllers by ID, and sites by row and column. Use integers, fixed representations for empty values and no whitespace or trailing line break. Include scenario ID and digest, seed, tick, stock, reserves, crews, claimed sites and status. Keep the one live save in browser-origin storage and show its storage limitations in the interface. Replay exports are local files and survive a browser storage reset if the file is retained.

### Authored campaign

Coordinates start at zero. All unspecified tiles are passable. A controls the human crew or crews. B controls the rival. Display the objective, turn budget and special terrain rule in the brief. Freeze scenario definitions before recording their fixture digests.

| Mission | Fixed initial state | Win and loss |
|---|---|---|
| First Beacon | 5 × 3. A1 at (0,1) and B2 at (4,1). Each starts with 2 stock. Cache at (2,1) holds 4. Build site at (2,0). Eight turns. | Win by building the site. Lose if the rival builds it or time expires. Human route east, east, collect, north, build. |
| Slackwater Crossing | 6 × 4. A1 at (0,1), A3 at (0,3), B2 at (5,0). A starts with 4 stock and B with 0. Site at (4,2). Caches at (1,1) and (4,0) hold 2 each. Column 3 is water except for the causeway at (3,2), which closes on turns 2 and 3. Ten turns. | Win by controlling the site while retaining at least 2 stock. Lose if the rival controls the site or time expires. A1 moves east and collects. A3 moves east, east, north, east, east, then builds. |
| Three Stakes | 7 × 5. A1 at (1,1), A3 at (1,3), B2 at (5,1), B4 at (5,3). Both start with 8 stock. Caches at (1,2) and (5,2) hold 2 each. Sites at (3,1), (3,3), (3,4). Twelve turns. | Win by controlling two sites and retaining at least 2 stock at the end of a turn. Lose if the rival gains two sites or time expires. A takes the first two sites with the lower crew IDs, then collects. |

### Independent turn fixture

The input supplies both controllers' orders directly. The fixture has no build sites, gates, rival-policy calls or mission outcome. Use a 5 × 3 open board, A1 at (0,1), B2 at (4,1), stocks A=2 and B=2, and a four-unit cache at (2,1). Seed 1 remains constant. The expected snapshots follow from the stated rules and should become test data independent of the engine.

| Tick | A order | B order | A tile | B tile | A stock | B stock | Cache |
|---:|---|---|---|---|---:|---:|---:|
| 0 | — | — | (0,1) | (4,1) | 2 | 2 | 4 |
| 1 | Move east | Move west | (1,1) | (3,1) | 2 | 2 | 4 |
| 2 | Move east | Move west | (2,1) | (3,1) | 2 | 2 | 4 |
| 3 | Collect | Wait | (2,1) | (3,1) | 4 | 2 | 2 |
| 4 | Move north | Move west | (2,0) | (3,1) | 4 | 2 | 2 |
| 5 | Wait | Move west | (2,0) | (2,1) | 4 | 2 | 2 |
| 6 | Wait | Collect | (2,0) | (2,1) | 4 | 4 | 0 |

On tick 2, B2's event records a contested destination. On tick 4 it records occupied-at-start. Changing input order must preserve the snapshots and event sequence. Review and hash an independent literal serialization fixture with a second SHA-256 implementation before using its value as a golden checksum.


## Epic · Play the first Tidepost campaign offline

Deliver a static build where the player can play all three missions in desktop Chrome using keyboard or pointer, return to a saved turn, and verify or step through a replay. Exit when all six tickets meet their acceptance criteria, three fixed win scripts and one deliberate loss produce the expected results, and the campaign passes a clean-profile offline run.

| Ticket | Priority | Depends on | Lane | Estimated engineering hours |
|---|---|---|---|---:|
| TP-1 · Deterministic turn engine | P0 | — | Engine | 4–6 |
| TP-2 · Rival policy and goal evaluation | P0 | TP-1 | Engine | 3–5 |
| TP-3 · Browser board and accessible controls | P0 | TP-1 | Interface | 4–6 |
| TP-4 · Save, continue and verifiable replay | P0 | TP-1 | Persistence | 4–6 |
| TP-5 · Three original missions and campaign flow | P0 | TP-2, TP-3, TP-4 | Campaign integration | 3–5 |
| TP-6 · Offline package and release verification | P0 | TP-5 | Release verification | 2–3 |

TP-2, TP-3 and TP-4 can run in parallel after TP-1 freezes the order, state and event contracts. TP-3 can use the engine fixture and a stub rival until TP-2 is integrated. TP-4 can verify persistence with the engine fixture and a deterministic scripted controller. TP-5 wires the real rival into the campaign and verifies replay. TP-6 verifies the integrated build. The 20–31-hour range estimates hands-on engineering, including tests. Parallel work can shorten elapsed time. All features and checks below are planned.

### TP-1 · Deterministic turn engine

Implement validated scenario and order types, tick phases and immutable state transitions. Define stable IDs, explicit action statuses and deterministic event ordering. Freeze interfaces for the parallel lanes and include the six-tick fixture.

- Reproduce all seven snapshots and event reasons in the fixture. Reverse input order and compare states and event sequence.
- Test swaps, entry into a tile vacated on the same tick, water, out-of-bounds positions, stock limits and an empty cache. Give two crews on separate sites exactly four shared stock and verify only the lower-ID crew spends it.
- Submit duplicate orders and a forged crew ID. Confirm rejection before any state change.

### TP-2 · Rival policy and goal evaluation

Implement the rival policy, shared planning reservations, shortest paths and mission goal evaluation. Introduce a scheduled-gate fixture before wiring the authored levels.

- Put a rival crew at (1,1) with equal-distance sites at (1,0) and (2,1), adequate stock and no obstacles. Expect the north step to the row-first site. Close the north destination and expect the east step.
- Give two rival crews on unclaimed sites exactly four shared stock. Expect only the lower-ID crew to queue Build. Block all four directions around one crew that has no local action and expect Wait.
- Assert simultaneous goal flags, success on the last allowed tick and timeout loss. Repeat identical policy calls and compare orders.

### TP-3 · Browser board and accessible controls

Build the grid, brief, crew toolbar, order preview, material and goal panel, and event log. Add labelled pointer controls and offline hotkeys. Arrow keys move the focused grid cursor, Space selects or clears a crew, M stages a move to the cursor, C Collects, B Builds, W Waits, N Advances and Escape clears the selected crew's staged order. Display terrain and post ownership in text where relevant.

- From the engine fixture, select A1, stage an east move and advance with a pointer. Repeat using keyboard-only controls and compare states.
- Confirm the selected crew, staged order and blocked reasons remain understandable without color. Verify visible focus, an accessible turn announcement and focus restoration when help closes.
- Confirm shortcuts run in the focused board controls and leave other inputs usable. Hold the advance key across a saved turn and verify only one transition.

### TP-4 · Save, continue and verifiable replay

Implement IndexedDB storage, record validation, canonical checksums and replay navigation. The deterministic scripted rival supplies the replay fixture before campaign integration.

- Save the fixture at tick 3, close Chrome, reopen at the documented origin and continue. Verify mission ID, positions, stock and reserves match the tick 3 fixture.
- Finish the fixture, export and re-import the replay, navigate through ticks 0, 2, 4 and 6, and verify expected states and the end digest.
- Reject wrong versions, bad digests, foreign crew IDs, post-terminal orders and a 257 KiB file. Confirm a valid save still opens. Force a transaction failure and confirm the interface shows the last confirmed tick while the in-memory run remains playable.

### TP-5 · Three original missions and campaign flow

Encode the authored maps and integer goals, write original briefings, connect unlocks and retries, and test saves and replays with the actual rival. Supply one complete scripted win per map and one deliberate loss.

- First Beacon reaches a win on turn 5 with the named route. A player who waits loses when the rival claims the site before timeout.
- Slackwater Crossing reports the gate closed on turns 2 and 3. Replay the successful route, verify the stock threshold after building, and verify mission 3 unlocks only after a win.
- Three Stakes verifies shared-destination contention and the retained-stock goal. Resume at a saved tick, finish, export and verify the same outcome using the real rival and unchanged scenario version.
- Confirm unlocked missions remain selectable after retry or loss. A valid imported replay cannot change campaign progress.

### TP-6 · Offline package and release verification

Package the static runtime, include a reproducible local launch command, and document keyboard controls, storage limitations and mission goals. Record observed build, automated check and manual verification results against the delivered artifacts.

- In a fresh Chrome profile, block external network access while preserving loopback. Load the package, complete three verified win paths and check for runtime requests to any other origin.
- Repeat a mission from its recorded order script in a second fresh browser profile and compare the final checksum and per-tick goal states.
- Complete First Beacon with only a keyboard. Close the browser after a confirmed save, reopen at the documented origin, and verify Continue and replay. Record the result and any accessibility or packaging gap.
