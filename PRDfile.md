# TrashDash: NYC Echo — Claude Code Implementation Plan
## Engineering Task Breakdown for Parallel Execution (v1.0)

This document translates the PRD (v2) into an execution plan a team of Claude Code
instances (or human engineers, or a mix) can pick up **in parallel with minimal
cross-blocking**. Every task below is written so that a single person/agent could
pick it up cold, with a file path, a concrete acceptance test, and no open
interpretation left to the implementer.

---

## 0. How To Use This Document

- The work is split into **Tracks** (A–H). A Track is a self-contained unit of
  work that one person/agent owns end-to-end.
- Each Track lists its **Blocking Dependencies** (what must exist before this
  Track can start) and **Produces** (what artifacts/interfaces it hands off to
  other Tracks).
- Every Track is broken into **numbered mini-steps**. Each mini-step has:
  - **File(s) touched** — exact path(s).
  - **Action** — the specific change to make.
  - **Definition of Done (DoD)** — an objective, checkable condition. If you
    can't check the box without judgment calls, the step is written wrong —
    flag it, don't guess.
- Steps within a Track are sequential (do them in order). Tracks themselves can
  run concurrently once their dependencies are satisfied — see the dependency
  graph in Section 1.4.
- Nothing in this document should require asking "what did they mean by X" —
  if something is genuinely undecided in the PRD, it is called out explicitly
  as an **ASSUMPTION LOCKED IN** so work can proceed without waiting on a
  meeting.

---

## 1. Foundational Decisions (Locked In So Work Can Start)

The PRD leaves several implementation-level choices open. To unblock parallel
work immediately, the following are **locked in as assumptions**. If the team
wants to change any of these later, that's fine — but changing them means
re-running the affected Track(s), not re-reading this whole document.

### 1.1 Tech Stack — LOCKED IN

| Layer | Choice | Why |
|---|---|---|
| Game engine | **Phaser 3** (v3.80+) | Native support for 2D sprites, drop-shadow/parallax layering, particle emitters, tweening (squash-and-stretch), scene management (maps 1:1 to "venues"), and pointer/drag input — covers nearly every mechanic in Sections 2–6 of the PRD out of the box. |
| Language | **TypeScript** | Strict typing on item/bin/venue data schemas prevents an entire class of "wrong bin id" bugs given how central the data schema is to scoring. |
| Build tool | **Vite** | Fast HMR for iterating on juice/feel (Section 4), which needs constant visual tweaking. |
| Audio | **Howler.js** wrapped by a custom `AudioLayerManager` | Needed for the layered-stem adaptive soundtrack (Section 4, Idea A) — Howler supports precise sprite-based playback and per-track volume control, which Phaser's built-in sound manager does not do cleanly for stem-layering. |
| State management | Plain TypeScript classes + a single `GameState` singleton (no Redux/MobX) | Game state is not complex enough to justify a state library; a singleton keeps this approachable for multiple contributors. |
| Testing | **Vitest** for scoring/data logic, manual QA checklist (Section 12) for game feel | Scoring math (Vector X/Y) is the one place a unit test meaningfully prevents regressions; visual "juice" is not unit-testable. |

### 1.2 Canvas & Sprite Spec — LOCKED IN (Open Item from PRD Section 2, resolved)

- **Base game canvas:** 1920×1080 logical resolution, scaled via Phaser's
  `Scale.FIT` mode so it works on kiosk touchscreens and desktop browsers alike.
- **Item sprites:** 256×256px source PNGs, transparent background, drawn at
  2x the max on-screen display size (128×128) for crisp scaling.
- **Bin sprites:** 384×512px source PNGs.
- **Character/UI sprites:** 256×256px minimum, transparent PNG.
- **Shadow sprites:** generated procedurally at runtime (Section 9, Track F,
  step F.4) rather than hand-drawn, so artists don't need to draw a shadow
  variant of every single item.
- **File format for handoff from artists:** PNG, sRGB, straight (non-premultiplied)
  alpha, named per the convention in Track F step F.6.

### 1.3 Repo & Folder Structure — LOCKED IN

```
trashdash/
├── src/
│   ├── main.ts                     # Phaser game bootstrap
│   ├── config/
│   │   ├── GameConfig.ts           # canvas size, physics, scale mode
│   │   └── ScoringConfig.ts        # point values, multiplier tables
│   ├── data/
│   │   ├── items.json              # item schema (Track A)
│   │   ├── bins.json               # bin schema (Track A)
│   │   ├── venues.json             # venue/level schema (Track A)
│   │   └── difficultyTiers.json    # CHI-tier config (Track E)
│   ├── scenes/
│   │   ├── BootScene.ts            # asset preload
│   │   ├── LevelSelectScene.ts     # venue picker (Track D)
│   │   ├── TrayScene.ts            # core disposal loop (Track B)
│   │   ├── CorrectionOverlayScene.ts  # stub, Track G
│   │   └── HUDScene.ts             # score/combo/timer overlay (Track B/C)
│   ├── entities/
│   │   ├── TrashItem.ts            # Track B
│   │   ├── Bin.ts                  # Track B
│   │   └── ParallaxLayer.ts        # Track F
│   ├── systems/
│   │   ├── ScoringSystem.ts        # Track B
│   │   ├── ComboSystem.ts          # Track B/C
│   │   ├── ChiSystem.ts            # Track D
│   │   ├── DifficultySystem.ts     # Track E
│   │   ├── AudioLayerManager.ts    # Track C
│   │   └── ParticleFXManager.ts    # Track C
│   ├── state/
│   │   └── GameState.ts            # singleton
│   └── util/
│       └── PlaceholderArtGenerator.ts  # Track 0
├── assets/
│   ├── sprites/
│   │   ├── items/
│   │   ├── bins/
│   │   ├── venues/
│   │   └── ui/
│   └── audio/
│       └── stems/
├── tests/
│   └── scoring.test.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 1.4 Track Dependency Graph

```
Track 0 (Scaffolding)
   │
   ├──► Track A (Data Schemas) ──────────────┐
   │        │                                 │
   │        ├──► Track B (Core Disposal Loop) │
   │        │        │                        │
   │        │        ├──► Track C (Juice/FX)  │
   │        │        │                        │
   │        │        └──► Track D (CHI/Venues)│◄── needs Track A venue data
   │        │                 │                │
   │        │                 └──► Track E (Difficulty Scaling)
   │        │
   │        └──► Track H (Municipal DB stub, low priority)
   │
   └──► Track F (Art/Sprite Pipeline) ── feeds sprites into B, C, D, F itself
   
Track G (Deferred Clusters B & C stubs) — no hard blockers, can start anytime,
   lowest priority.
```

**Practical read of this graph:** Track 0 must finish first (it's ~1 day of
work for one person). The moment Track 0 is done, Tracks A and F can start in
parallel. The moment Track A's schemas are committed, Track B can start.
Tracks C, D can start in parallel the moment Track B's event interfaces
(Section 5, step B.9) are committed — they do not need to wait for each other.
Track E needs both C's and D's outputs. Tracks G and H can be picked up by
anyone at any time since nothing else depends on them.

---

## 2. Track 0 — Project Scaffolding & Infrastructure
**Owner:** 1 person. **Blocking dependency:** none — start immediately.
**Produces:** a running empty game shell that every other Track builds on top of.

**0.1 — Initialize repository**
- File(s): repo root
- Action: `git init`, create `.gitignore` (node_modules, dist, .env)
- DoD: `git status` shows a clean repo with a single initial commit.

**0.2 — Scaffold Vite + TypeScript + Phaser project**
- File(s): `package.json`, `vite.config.ts`, `tsconfig.json`
- Action: `npm create vite@latest trashdash -- --template vanilla-ts`, then
  `npm install phaser howler`, `npm install -D vitest`.
- DoD: `npm run dev` serves a blank page with no console errors at `localhost:5173`.

**0.3 — Configure `tsconfig.json` strict mode**
- File(s): `tsconfig.json`
- Action: set `"strict": true`, `"noImplicitAny": true`, `"noUnusedLocals": true`.
- DoD: `npm run build` completes with zero TypeScript errors on the blank scaffold.

**0.4 — Create folder structure**
- Action: create every folder listed in Section 1.3 (empty `.gitkeep` files
  where needed so Git tracks empty dirs).
- DoD: `tree src assets tests` output matches Section 1.3 exactly.

**0.5 — Bootstrap Phaser game instance**
- File(s): `src/main.ts`, `src/config/GameConfig.ts`
- Action: `GameConfig.ts` exports a `Phaser.Types.Core.GameConfig` object with
  `width: 1920, height: 1080, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }`.
  `main.ts` imports it and instantiates `new Phaser.Game(GameConfig)`.
- DoD: opening the dev server shows a black 1920×1080 canvas that resizes to
  fit the browser window without distortion.

**0.6 — Create `BootScene` with placeholder asset loader**
- File(s): `src/scenes/BootScene.ts`
- Action: `BootScene.preload()` loads a hardcoded list of placeholder keys
  (see 0.7) and transitions to `LevelSelectScene` on complete.
- DoD: console logs `"BootScene: assets loaded"` and scene transitions without error.

**0.7 — Build `PlaceholderArtGenerator` utility**
- File(s): `src/util/PlaceholderArtGenerator.ts`
- Action: write a function
  `generatePlaceholderTexture(scene: Phaser.Scene, key: string, color: number, label: string, width: number, height: number): void`
  that uses `Phaser.GameObjects.Graphics` to draw a colored rounded rectangle
  with the label text centered, then calls `generateTexture(key, width, height)`
  so it can be used exactly like a loaded PNG (`this.add.sprite(x, y, key)`).
  This exists so Tracks B/C/D/E are never blocked waiting on final art from
  Track F.
- DoD: calling `generatePlaceholderTexture(scene, 'item_apple_core', 0x8B4513, 'APPLE', 128, 128)`
  produces a texture that can be rendered with `add.sprite(400, 400, 'item_apple_core')`.

**0.8 — Configure ESLint + Prettier**
- File(s): `.eslintrc.cjs`, `.prettierrc`
- Action: install `eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`,
  `prettier`. Use default recommended rule sets, no custom rule debates — this
  is infra, not a design decision.
- DoD: `npm run lint` runs with zero errors on the scaffold.

**0.9 — Set up Vitest**
- File(s): `vite.config.ts` (add `test` block), `tests/example.test.ts`
- Action: add a trivial test (`expect(1+1).toBe(2)`) to confirm the test
  runner works before any real logic depends on it.
- DoD: `npm run test` passes 1/1.

**0.10 — Git branching convention (for parallel work)**
- Action: document in `README.md` that each Track works on `track/<letter>-<short-name>`
  (e.g. `track/b-disposal-loop`), and integration happens via PRs into `main`
  in the order specified in Section 13 (Milestones).
- DoD: `README.md` contains this convention; first PR (Track 0 itself) merged into `main`.

---

## 3. Track A — Data Schemas & Game Config
**Owner:** 1 person. **Blocking dependency:** Track 0 complete.
**Produces:** `items.json`, `bins.json`, `venues.json`, `ScoringConfig.ts` —
consumed by Tracks B, D, E.

**A.1 — Define the `Bin` schema**
- File: `src/data/bins.json`
- Action: create an array of objects:
  ```json
  { "id": "paper", "displayName": "Paper", "color": "#3B82F6" },
  { "id": "compost", "displayName": "Compost", "color": "#22C55E" },
  { "id": "plastic", "displayName": "Plastic", "color": "#EAB308" },
  { "id": "landfill", "displayName": "Landfill", "color": "#6B7280" }
  ```
- DoD: file validates against JSON schema in A.2 with zero errors.

**A.2 — Write JSON schema validators**
- File: `src/data/schemas/binSchema.ts`, `itemSchema.ts`, `venueSchema.ts`
  (use `zod` — add `npm install zod`)
- Action: `export const BinSchema = z.object({ id: z.string(), displayName: z.string(), color: z.string() })`
  and equivalent for items/venues (fields per A.3/A.4).
- DoD: a Vitest test in `tests/schema.test.ts` parses each JSON data file
  through its schema and asserts no throw.

**A.3 — Define the `TrashItemDef` schema and populate `items.json`**
- File: `src/data/items.json`
- Action: each item object has exactly these fields:
  ```ts
  {
    id: string;              // "coffee_cup_lid"
    displayName: string;
    spriteKey: string;       // matches placeholder key convention: "item_<id>"
    correctBinId: string;    // must match a bins.json id
    isComposite: boolean;    // true for multi-material items (Cluster B, deferred — field exists for forward-compat)
    componentIds: string[];  // empty array if isComposite is false
    venueIds: string[];      // which venues this item can spawn in
  }
  ```
  Populate with **at minimum** these 12 items for Level 1 (Mackenzie Cafe):
  `paper_plate`, `plastic_fork`, `food_scraps`, `coffee_cup`, `coffee_cup_lid`,
  `napkin_clean`, `napkin_greasy`, `apple_core`, `plastic_water_bottle`,
  `aluminum_can`, `paper_straw_wrapper`, `plastic_straw`.
- DoD: `npm run test` (schema test from A.2) passes on the populated file;
  every `correctBinId` value exists in `bins.json`.

**A.4 — Define the `Venue` schema and populate `venues.json`**
- File: `src/data/venues.json`
- Action: each venue object:
  ```ts
  {
    id: string;               // "mackenzie_cafe"
    displayName: string;
    unlockChiThreshold: number; // 0 for level 1, 40 for level 2, 70 for level 3
    itemPoolIds: string[];      // subset of items.json ids
    backgroundKeys: {
      clean: string; grimy: string; ruined: string; // parallax bg variants, Track F/D
    };
  }
  ```
  Populate three venues: `mackenzie_cafe` (threshold 0), `financial_district_office`
  (threshold 40), `times_square` (threshold 70), per PRD Section 5.
- DoD: schema test passes; every `itemPoolIds` entry exists in `items.json`.

**A.5 — Write `ScoringConfig.ts`**
- File: `src/config/ScoringConfig.ts`
- Action: export constants exactly matching PRD Section 3 table:
  ```ts
  export const SCORING = {
    CORRECT_BIN_POINTS: 50,
    CONTAMINATION_PENALTY: -100,
    VELOCITY_FAST_THRESHOLD_MS: 1000,   // sort within 1s
    VELOCITY_FAST_MULTIPLIER: 2.0,
    VELOCITY_SLOW_THRESHOLD_MS: 5000,   // sort after 5s
    VELOCITY_SLOW_MULTIPLIER: 0.5,
  } as const;
  ```
- DoD: values match PRD Section 3 table exactly (peer-check against the PRD, not memory).

**A.6 — Write `difficultyTiers.json`**
- File: `src/data/difficultyTiers.json`
- Action: encode PRD Section 6 Idea A table verbatim:
  ```json
  [
    { "tier": "beginner",     "chiMin": 0,  "chiMax": 30,  "trayTimerSec": 45, "errorPenaltyMultiplier": 0.5, "visualCuesActive": true,  "dualTargeting": false },
    { "tier": "intermediate", "chiMin": 31, "chiMax": 70,  "trayTimerSec": 30, "errorPenaltyMultiplier": 1.0, "visualCuesActive": false, "dualTargeting": false },
    { "tier": "expert",       "chiMin": 71, "chiMax": 100, "trayTimerSec": 20, "errorPenaltyMultiplier": 1.5, "visualCuesActive": false, "dualTargeting": true }
  ]
  ```
- DoD: schema test passes; ranges are contiguous with no gaps or overlaps (0–30, 31–70, 71–100).

**A.7 — Commit and tag**
- Action: PR into `main` titled `Track A: data schemas`. Tag commit `track-a-complete`.
- DoD: Tracks B and F can now branch from `main` and have real data to import.

---

## 4. Track B — Core Disposal Loop (PRD Section 3, Cluster A)
**Owner:** 1–2 people. **Blocking dependency:** Track A complete (needs `items.json`,
`bins.json`, `ScoringConfig.ts`). Can use Track 0's `PlaceholderArtGenerator` so it
does not need to wait on Track F.
**Produces:** `TrayScene`, `TrashItem`, `Bin`, `ScoringSystem`, `ComboSystem`, and
a documented event interface that Tracks C and D subscribe to.

**B.1 — Build `TrashItem` entity class**
- File: `src/entities/TrashItem.ts`
- Action: `class TrashItem extends Phaser.GameObjects.Sprite` with a constructor
  taking `(scene, x, y, itemDef: TrashItemDef)`. Store `itemDef` as a public
  readonly field. Add `setInteractive({ draggable: true })` in the constructor.
- DoD: instantiating `new TrashItem(scene, 100, 100, itemDef)` renders a
  draggable sprite at (100,100) using `itemDef.spriteKey`.

**B.2 — Build `Bin` entity class**
- File: `src/entities/Bin.ts`
- Action: `class Bin extends Phaser.GameObjects.Zone` (invisible hitbox) with
  a child `Phaser.GameObjects.Sprite` for the visual bin icon, sized per
  Section 1.2 (384×512). Constructor takes `(scene, x, y, binDef: BinDef)`.
  Expose `getBounds()` for overlap checks.
- DoD: instantiating a `Bin` renders the bin sprite and its zone bounds are
  logged correctly via `console.log(bin.getBounds())`.

**B.3 — Implement drag input on `TrashItem`**
- File: `src/entities/TrashItem.ts`
- Action: listen to Phaser's `'drag'` event on the scene
  (`scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {...})`)
  filtered to instances of `TrashItem`, updating `gameObject.x/y` to `dragX/dragY`.
- DoD: manually dragging an item sprite with the mouse moves it smoothly with
  no visual lag, confirmed in dev server.

**B.4 — Implement "lock-on" reticle on hover/drag-start**
- File: `src/entities/TrashItem.ts`
- Action: on `'dragstart'`, add a child `Phaser.GameObjects.Graphics` circle
  outline (radius = sprite width/2 + 8px, color `0x00FFFF`, alpha pulsing via
  a `scene.tweens.add` yoyo tween on `alpha` 0.4↔1.0, duration 500ms, repeat -1).
  Destroy the reticle graphic on `'dragend'`.
- DoD: dragging an item shows a pulsing cyan ring around it that disappears
  the instant the drag ends.

**B.5 — Implement drop-zone overlap detection**
- File: `src/scenes/TrayScene.ts`
- Action: on `'dragend'`, iterate all `Bin` instances, use
  `Phaser.Geom.Rectangle.Overlaps(item.getBounds(), bin.getBounds())` to find
  the target bin (if none overlap, tween the item back to its original
  tray position over 200ms). If exactly one bin overlaps, call
  `resolveDrop(item, bin)` (defined in B.6).
- DoD: dropping an item fully inside a bin's hitbox triggers `resolveDrop`;
  dropping it outside any bin snaps it back to origin.

**B.6 — Implement `ScoringSystem.resolveDrop()`**
- File: `src/systems/ScoringSystem.ts`
- Action: `resolveDrop(item: TrashItem, bin: Bin, dragStartTimeMs: number): DropResult`
  where `DropResult = { correct: boolean; pointsAwarded: number; velocityMultiplier: number }`.
  Logic:
  1. `correct = item.itemDef.correctBinId === bin.binDef.id`
  2. `elapsed = Date.now() - dragStartTimeMs`
  3. `velocityMultiplier = elapsed <= SCORING.VELOCITY_FAST_THRESHOLD_MS ? SCORING.VELOCITY_FAST_MULTIPLIER : elapsed >= SCORING.VELOCITY_SLOW_THRESHOLD_MS ? SCORING.VELOCITY_SLOW_MULTIPLIER : 1.0`
  4. `pointsAwarded = correct ? SCORING.CORRECT_BIN_POINTS * velocityMultiplier : SCORING.CONTAMINATION_PENALTY`
- DoD: Vitest unit test in `tests/scoring.test.ts` covers all 3 velocity
  buckets × both correctness states (6 cases) with exact expected point values.

**B.7 — Implement `ComboSystem`**
- File: `src/systems/ComboSystem.ts`
- Action: `class ComboSystem` with `private comboCount = 0`, methods
  `registerCorrect(): number` (increments and returns new combo count) and
  `registerIncorrect(): void` (resets `comboCount` to 0). Emits a Phaser event
  `'combo-changed'` with the new count via an internal `EventEmitter`.
- DoD: unit test: 3 correct calls → combo count 3; then 1 incorrect call →
  combo count 0; `'combo-changed'` fired 4 times total with values [1,2,3,0].

**B.8 — Implement 30-second tray timer + round-end**
- File: `src/scenes/TrayScene.ts`
- Action: `scene.time.delayedCall(30000, () => this.endRound())`. `endRound()`
  emits `'round-ended'` with the round's total score and accuracy percentage,
  then transitions to `HUDScene`'s summary state.
- DoD: starting a round and waiting 30s (or fast-forwarding via a debug
  keybind, e.g. pressing `F` to force-end) triggers `'round-ended'` exactly once.

**B.9 — Define and document the public event interface (hand-off to Tracks C & D)**
- File: `src/systems/GameEvents.ts`
- Action: create a single typed `EventEmitter` (or Phaser's built-in
  `Phaser.Events.EventEmitter`) exporting these named events with fixed
  payload shapes — **this is the contract Tracks C and D build against, do
  not change these signatures without notifying both Tracks:**
  ```ts
  'item-locked-on': { item: TrashItem }
  'item-dropped': { item: TrashItem; bin: Bin; result: DropResult }
  'combo-changed': { combo: number }
  'round-ended': { totalScore: number; accuracyPct: number; venueId: string }
  ```
- DoD: a throwaway test scene subscribes to all four events and logs them;
  manually playing one round prints all four event types in the console in
  the expected order.

**B.10 — Wire up `HUDScene` for score/combo/timer display**
- File: `src/scenes/HUDScene.ts`
- Action: subscribe to `'item-dropped'` (update score text), `'combo-changed'`
  (update combo text), and a `scene.time` countdown display updated every
  frame from `TrayScene`'s remaining time (expose via `TrayScene.getRemainingMs()`).
- DoD: playing manually, the on-screen score number increases/decreases
  correctly on each drop, combo number updates live, and the timer counts
  down from 45/30/20 (whichever tier is active — defaults to 30 until Track E lands).

**B.11 — PR and tag**
- Action: PR into `main` titled `Track B: core disposal loop`. Tag `track-b-complete`.
- DoD: `main` has a fully playable (if unstyled) round: drag items, drop in
  bins, see score/combo/timer update, round ends at 0:00.

---

## 5. Track C — Audio-Visual Juice (PRD Section 4, Ideas A & C)
**Owner:** 1 person. **Blocking dependency:** Track B's event interface (B.9) committed.
**Produces:** `ParticleFXManager`, `AudioLayerManager`, squash-and-stretch +
screen-shake behavior — all driven purely by subscribing to Track B's events
(no changes to Track B's files needed).

**C.1 — Build `ParticleFXManager`**
- File: `src/systems/ParticleFXManager.ts`
- Action: `class ParticleFXManager` with method
  `playCorrectSortFX(scene: Phaser.Scene, position: {x,y}, binId: string, comboCount: number): void`.
  Uses `scene.add.particles(x, y, textureKey, config)` where `textureKey` maps
  per bin (`paper` → confetti texture, `compost` → green sparkle, `plastic`
  → water-splash texture, `landfill` → dust puff). `config.scale` and
  `config.lifespan` scale up linearly with `comboCount` (e.g.
  `scale: 0.5 + Math.min(comboCount, 5) * 0.15`).
- DoD: calling the method at combo 1 vs combo 5 visibly produces a larger/
  longer-lived particle burst; manually verified in dev server.

**C.2 — Implement "UI border catches fire" at 5x combo**
- File: `src/scenes/HUDScene.ts` (subscribes to `'combo-changed'`)
- Action: when payload `combo >= 5`, add a looping fire-shader-free approximation:
  an animated orange/red particle emitter running along the four edges of the
  1920×1080 canvas border, `scene.add.particles` with a rectangle emit zone
  using `Phaser.Types.GameObjects.Particles.EdgeZoneSource`. Remove/stop the
  emitter when a `'combo-changed'` payload drops below 5.
- DoD: reaching combo 5 in manual play shows the border ignite; a subsequent
  mistake (combo resets to 0) stops it within one frame.

**C.3 — Build `AudioLayerManager`**
- File: `src/systems/AudioLayerManager.ts`
- Action: `class AudioLayerManager` wrapping 4 Howler `Howl` instances (drums,
  bass, synth_pads, lead — placeholder loop files, see C.4), all set to
  `loop: true`, all started simultaneously at volume 0 except drums at volume 1
  on scene start. Method `setComboTier(combo: number): void` maps
  combo 0 → drums only (others volume 0), combo ≥1 → +bass, combo ≥2 → +synth_pads
  (matches PRD's 1×/2×/3× layering — note PRD says "1×=drums, 2×=bass, 3×=synth,
  5×=full"; implement exactly this mapping: combo 0–0 drums only, combo 1
  adds bass, combo 2 adds synth pads, combo ≥4 adds lead for "full" at 5×).
  Volume transitions use `Howl.fade(from, to, durationMs=300)` for smoothness,
  not instant cuts.
- DoD: subscribing this manager to `'combo-changed'` and manually playing
  through combo 0→5 audibly layers in each stem at the right threshold.

**C.4 — Source/produce placeholder audio stems**
- File: `assets/audio/stems/drums.mp3`, `bass.mp3`, `synth_pads.mp3`, `lead.mp3`
- Action: since original stems aren't composed yet, generate royalty-free
  placeholder loops (4 bars, 120 BPM, seamlessly looping) — this is a content
  task, not a code task; if no composer is available yet, use any
  royalty-free loop pack and label clearly as `PLACEHOLDER_` prefixed filenames
  so they're trivially find-and-replaceable later.
- DoD: all four files exist, are same length/tempo/bar-count so they stay in
  sync when layered, and loop without an audible seam.

**C.5 — Implement music-cut-to-silence on mistake**
- File: `src/systems/AudioLayerManager.ts`
- Action: subscribe to `'item-dropped'`; if `result.correct === false`, call
  `fade(currentVolume, 0, 150)` on ALL four stems simultaneously (not just
  reset the tier), creating the "dramatic silence." Resume from drums-only
  0.5s later automatically (per PRD, silence "demands redemption," it should
  not be a hard stop the player has to fix manually).
- DoD: making a mistake in manual play cuts all audio within 150ms and it
  resumes with drums only ~500ms later.

**C.6 — Implement bin squash-and-stretch on successful drop**
- File: `src/entities/Bin.ts`
- Action: on receiving a drop, run
  `scene.tweens.add({ targets: binSprite, scaleX: 1.15, scaleY: 0.85, duration: 80, yoyo: true, ease: 'Sine.easeOut' })`.
- DoD: every successful drop visibly "thwacks" the bin — squashes then
  restores — confirmed in dev server frame-by-frame (Chrome DevTools
  performance panel or slow-mo screen recording).

**C.7 — Implement screen shake on drop**
- File: `src/scenes/TrayScene.ts`
- Action: on `'item-dropped'`, call `scene.cameras.main.shake(80, 0.005)`
  (duration ms, intensity) — intensity scaled slightly up for correct drops
  vs down for incorrect (e.g. 0.005 correct, 0.002 incorrect, since a
  contamination shouldn't feel as "juicy"/rewarding).
- DoD: manual play shows a visible, brief camera shake on every drop, subtly
  different in intensity between correct and incorrect.

**C.8 — Implement drop "thud" SFX**
- File: `assets/audio/sfx/thud.mp3` (placeholder, same sourcing note as C.4),
  `src/systems/AudioLayerManager.ts` (add a one-shot SFX player method
  `playThud(): void` alongside the stem-layer logic)
- DoD: every drop plays an audible one-shot thud independent of the looping
  music stems.

**C.9 — PR and tag**
- Action: PR into `main` titled `Track C: juice`. Tag `track-c-complete`.
- DoD: playing a round on `main` now feels responsive — particles, combo
  fire border, layered music, squash-stretch, screen shake, and thud all
  present with zero changes to Track B's files (diff should show only new
  files + `HUDScene.ts`/`TrayScene.ts`/`Bin.ts` event-subscription additions).

---

## 6. Track D — CHI & Venue Meta-Game (PRD Section 5)
**Owner:** 1 person. **Blocking dependency:** Track A (`venues.json`) + Track B
event interface (`'round-ended'`).
**Produces:** `ChiSystem`, `LevelSelectScene`, per-venue environmental decay visuals.

**D.1 — Build `ChiSystem`**
- File: `src/systems/ChiSystem.ts`
- Action: `class ChiSystem` storing `Map<venueId, number>` (per-venue CHI,
  0–100, default 50 on first visit per PRD's "Grindstone" middle tier being
  the neutral starting point). Method
  `updateChi(venueId: string, roundAccuracyPct: number): number` —
  formula: `newChi = clamp(currentChi + (roundAccuracyPct - 50) * 0.3, 0, 100)`
  (i.e., an accuracy above 50% nudges CHI up, below 50% nudges it down;
  the `0.3` damping factor prevents wild single-round swings — this is a
  **LOCKED IN ASSUMPTION**, tune later via playtesting if it feels too
  slow/fast). Persists to `localStorage` under key `trashdash_chi_<venueId>`.
- DoD: unit test: starting CHI 50, one round at 100% accuracy → CHI 65;
  one round at 0% accuracy → CHI 35. Persisted value survives a page reload
  (manually verified: play a round, refresh browser, CHI value unchanged).

**D.2 — Subscribe `ChiSystem` to `'round-ended'`**
- File: `src/scenes/TrayScene.ts` or a dedicated `MetaGameController.ts`
- Action: on `'round-ended'`, call `chiSystem.updateChi(payload.venueId, payload.accuracyPct)`.
- DoD: manual play — completing a round changes the stored CHI value by the
  amount predicted by the D.1 formula.

**D.3 — Implement venue unlock gating**
- File: `src/scenes/LevelSelectScene.ts`
- Action: for each venue in `venues.json`, render it as locked (greyed out,
  non-interactive) if `chiSystem.getChi(previousVenueId) < venue.unlockChiThreshold`,
  else interactive. Level 1 always unlocked.
- DoD: fresh save (CHI 50 default) shows Level 1 unlocked, Level 2 locked
  (needs 40 — wait, note: at default CHI 50, Level 2's threshold of 40 would
  already be met; confirm against Track A's `unlockChiThreshold` values chosen
  in A.4 and adjust starting CHI or thresholds so Level 1 must be **played**
  before Level 2 unlocks — recommended fix: default per-venue CHI starts at 0,
  not 50, until the player completes at least one round there; use this as
  the corrected rule in D.1's initialization logic).
- DoD (corrected): a brand-new save shows only Level 1 unlocked; Level 2
  unlocks only after Level 1's CHI crosses 40 through actual play.

**D.4 — Build per-venue environmental decay state machine**
- File: `src/systems/VenueDecayState.ts`
- Action: `enum DecayState { CLEAN, DECLINING, RUINED }`. Track consecutive
  failed rounds per venue (`failStreak: Map<venueId, number>`, a "fail" =
  `accuracyPct < 50` for that round, matching PRD's "repeatedly fails to
  progress"). `failStreak >= 2` → `DECLINING`; `failStreak >= 4` → `RUINED`;
  any successful round (`accuracyPct >= 50`) resets `failStreak` to 0 and
  state to `CLEAN`.
- DoD: unit test covering the exact transition thresholds (0/1 fails = CLEAN,
  2–3 fails = DECLINING, 4+ fails = RUINED, one success at any point resets to CLEAN).

**D.5 — Wire decay state to background swap**
- File: `src/scenes/TrayScene.ts`
- Action: on scene create, and on every `'round-ended'`, read
  `venueDecayState.getState(venueId)` and set the active `ParallaxLayer`
  background texture to `venue.backgroundKeys.clean` / `.grimy` / `.ruined`
  accordingly (see Track F for `ParallaxLayer` itself).
- DoD: manually forcing 4 losing rounds in a row visibly swaps the background
  from clean → grimy → ruined; one win resets it to clean.

**D.6 — Build `LevelSelectScene` UI**
- File: `src/scenes/LevelSelectScene.ts`
- Action: render one card per venue (name, current CHI as a numeric readout
  and a simple horizontal bar fill 0–100, locked/unlocked state from D.3).
  Clicking an unlocked card starts `TrayScene` with `venueId` passed via
  scene data (`scene.start('TrayScene', { venueId })`).
- DoD: manual click-through — selecting an unlocked venue starts a round in
  that venue; clicking a locked venue does nothing (or shows a "reach CHI X
  in previous venue" tooltip — tooltip is a nice-to-have, not required for DoD).

**D.7 — PR and tag**
- Action: PR into `main` titled `Track D: CHI & venues`. Tag `track-d-complete`.
- DoD: `main` now has a level-select screen gating 3 venues by CHI, each
  tracking and visually reflecting its own decay state independent of the others.

---

## 7. Track E — Difficulty Scaling (PRD Section 6)
**Owner:** 1 person. **Blocking dependency:** Track C complete (visual cues)
+ Track D complete (CHI tiers) + Track A (`difficultyTiers.json`).

**E.1 — Build `DifficultySystem`**
- File: `src/systems/DifficultySystem.ts`
- Action: `getTierForChi(chi: number): DifficultyTier` looks up
  `difficultyTiers.json` and returns the matching tier object by range.
- DoD: unit test: chi=0→beginner, chi=30→beginner, chi=31→intermediate,
  chi=70→intermediate, chi=71→expert, chi=100→expert (boundary values explicitly tested).

**E.2 — Wire tray timer to tier**
- File: `src/scenes/TrayScene.ts`
- Action: replace the hardcoded `30000` from step B.8 with
  `difficultySystem.getTierForChi(currentVenueChi).trayTimerSec * 1000`.
- DoD: playing a venue at CHI 20 gives a 45s timer; at CHI 50, 30s; at CHI 80, 20s.

**E.3 — Wire error penalty scaling to tier**
- File: `src/systems/ScoringSystem.ts`
- Action: multiply the contamination penalty from B.6 by
  `tier.errorPenaltyMultiplier` (0.5 beginner, 1.0 intermediate, 1.5 expert).
- DoD: unit test — same incorrect drop yields -50 at beginner, -100 at
  intermediate, -150 at expert.

**E.4 — Wire visual cue toggle to tier**
- File: `src/entities/TrashItem.ts`
- Action: if `tier.visualCuesActive === true`, keep the glowing lock-on
  reticle from B.4 always-visible (not just on drag) plus render a small
  text label under the item showing its correct bin category name; if
  `false`, show neither — only the base sprite, no hint.
- DoD: beginner tier shows glow + text hint on every item at rest;
  intermediate/expert show neither.

**E.5 — Implement expert-tier dual-targeting**
- File: `src/scenes/TrayScene.ts`
- Action: when `tier.dualTargeting === true`, allow two `TrashItem` instances
  to be simultaneously in a "dragging" state by tracking drags via
  Phaser's multi-pointer support (`input.addPointer(1)` to enable a second
  pointer, then key drag state off `pointer.id` rather than assuming a
  single active pointer).
- DoD: on a touch device or with two simulated pointers, two items can be
  dragged at the same time in expert tier; only one at a time is possible
  in beginner/intermediate tiers (enforce via a `maxSimultaneousDrags` check
  gating additional `'dragstart'` events).

**E.6 — Implement volume & complexity escalation**
- File: `src/scenes/TrayScene.ts`
- Action: tray item count scales with tier:
  beginner = 4 items/tray, intermediate = 6, expert = 9 (LOCKED IN
  ASSUMPTION — PRD does not give exact numbers, these are reasonable
  defaults, tune via playtesting). Composite-item ratio (`isComposite: true`
  items) in the random draw pool scales 0% beginner, 20% intermediate,
  40% expert — note composite items currently have no special handling
  since Cluster B is deferred (Track G); until Track G lands, composite
  items should simply be excluded from the spawn pool regardless of tier
  (`isComposite === false` filter) to avoid spawning items with no valid
  resolution path. Revisit this exclusion once Track G's stub interface exists.
- DoD: item count per tray matches the tier defaults above, confirmed by
  logging `trayItems.length` at round start for each tier; no
  `isComposite: true` item ever spawns until Track G is merged.

**E.7 — PR and tag**
- Action: PR into `main` titled `Track E: difficulty scaling`. Tag `track-e-complete`.
- DoD: playing the same venue at three different CHI levels (manually set
  via `localStorage` for testing) produces visibly different timer length,
  item count, hint visibility, and penalty severity.

---

## 8. Track F — Art & Sprite Integration Pipeline (PRD Section 2)
**Owner:** 1 person (ideally whoever is coordinating with the hand-drawing
artist(s)). **Blocking dependency:** Track 0 complete. Runs in parallel with
everything else — its job is to make swapping placeholder art for final art
a zero-code-change operation.

**F.1 — Write the sprite handoff spec doc**
- File: `docs/ART_SPEC.md`
- Action: document, for artists, the exact deliverable format: PNG,
  transparent straight alpha, sRGB; item sprites 256×256px; bin sprites
  384×512px; venue background layers exported as 3 separate PNGs per venue
  (foreground/midground/background) at 1920×1080 each for the parallax
  system (F.3); naming convention `item_<id>.png` matching `items.json`
  `id` fields exactly, `bin_<id>.png` matching `bins.json`, `venue_<venueId>_bg_<layer>.png`
  matching `venues.json`.
- DoD: doc exists and every filename convention in it is cross-checked
  against actual `id` values currently in `items.json`/`bins.json`/`venues.json`
  (i.e., no typos/mismatches between spec and real data).

**F.2 — Build the asset manifest loader**
- File: `src/scenes/BootScene.ts`
- Action: `BootScene.preload()` iterates `items.json`, `bins.json`,
  `venues.json` and calls `this.load.image(key, path)` for each expected
  file under `assets/sprites/...`. **Critically:** on a `'loaderror'` event
  for any given key, fall back to calling `PlaceholderArtGenerator`
  (Track 0, step 0.7) for that specific key instead of failing the whole
  boot — this means Tracks B/C/D/E can run indefinitely on placeholders
  with zero code changes as real art trickles in file-by-file.
  Note: Phaser's default `loaderror` behavior doesn't call user code
  per-file automatically — this must be wired explicitly via
  `this.load.on('loaderror', (file) => this.generatePlaceholderFor(file.key))`.
- DoD: deleting a single sprite file from `assets/sprites/items/` and
  reloading the game still boots successfully, showing a labeled colored
  placeholder box only for that missing item, real art for everything else.

**F.3 — Build `ParallaxLayer` entity**
- File: `src/entities/ParallaxLayer.ts`
- Action: `class ParallaxLayer` taking 3 texture keys (foreground, midground,
  background) and a `scrollFactor` per layer (e.g. bg 0.2, mid 0.5, fg 0.8)
  set via `sprite.setScrollFactor(factor)`, so camera pans (even subtle ones
  from screen-shake, Track C step C.7) create a depth illusion.
- DoD: triggering a screen-shake (C.7) visibly moves the three layers at
  different relative speeds, confirming parallax is functioning, not just
  three static stacked images.

**F.4 — Implement procedural drop-shadow generation**
- File: `src/entities/TrashItem.ts` (and `Bin.ts`)
- Action: on sprite creation, generate a shadow via a second
  `Phaser.GameObjects.Sprite` using the **same texture** as the item, tinted
  black (`setTint(0x000000)`), alpha 0.35, offset `(x + 6, y + 8)`, scaled
  `0.95`, and rendered **behind** the real sprite (`setDepth` lower). This
  satisfies the PRD's "drop shadow under sprites" requirement without
  requiring artists to hand-draw a shadow variant of every asset.
- DoD: every `TrashItem` and `Bin` instance visibly casts a soft dark shadow
  offset down-right, confirmed by visual inspection in dev server.

**F.5 — Implement subtle shading/highlight pass**
- File: `src/entities/TrashItem.ts`
- Action: apply a static top-left highlight via a small semi-transparent
  white `Graphics` overlay (radial gradient approximated with a few
  concentric circles at decreasing alpha) parented to each item sprite,
  giving a pseudo-3D "lit from above" look per PRD Section 2.
- DoD: items visually read as having a light source from the top-left,
  confirmed by visual inspection; this is a cheap static effect, not a
  dynamic lighting system — do not over-build this.

**F.6 — Deliver first placeholder-to-real-art swap for Level 1 items**
- File: `assets/sprites/items/*.png` (the 12 items from Track A step A.3)
- Action: once artist deliverables arrive for Mackenzie Cafe items, drop
  them into `assets/sprites/items/` using the exact naming convention from
  F.1. No code changes required if F.2 was built correctly.
- DoD: reloading the game shows real hand-drawn art for all 12 Level 1
  items with zero code changes; any item still showing a placeholder box
  indicates a filename mismatch to fix (per F.1's cross-check).

**F.7 — PR and tag**
- Action: PR into `main` titled `Track F: art pipeline`. Tag `track-f-complete`.

---

## 9. Track G — Deferred Mechanic Clusters (PRD Section 3, Clusters B & C)
**Status: explicitly deferred by the PRD — this Track exists so the
interfaces are ready for a future sprint, not so this ships in MVP.**
**Owner:** anyone, whenever capacity allows. **Blocking dependency:** none
(can start any time), but should NOT be merged into the MVP spawn pool
(see Track E step E.6's exclusion note) until explicitly greenlit.

**G.1 — Stub Cluster C: Correction Overlay scene**
- File: `src/scenes/CorrectionOverlayScene.ts`
- Action: build a scene that, given a list of this round's incorrect drops
  (`{ item: TrashItemDef, binUsed: BinDef, correctBinId: string }[]`, sourced
  from `'item-dropped'` events accumulated during the round), renders one
  row per mistake: item name, "You put it in: X", "Should go in: Y", and a
  short static explanation string. Explanation strings can be a simple
  lookup table keyed by item id in a new `src/data/explanations.json`
  (populate at least the 12 Level 1 items).
- DoD: manually forcing 2–3 incorrect drops in a round and ending it
  navigates to this scene showing exactly those mistakes with correct
  explanation text pulled from `explanations.json`.
- **Note:** per the PRD, this is "software only, easiest to bring back" —
  it is safe to actually wire this into the round-end flow (replacing/
  supplementing `HUDScene`'s summary) if the team wants it in MVP; flag this
  decision to whoever owns Section 13 milestone planning rather than
  deciding unilaterally, since the PRD marks it deferred.

**G.2 — Stub Cluster B: composite item interfaces (no gameplay yet)**
- File: `src/entities/TrashItem.ts`
- Action: add (but do not activate) a `componentIds: string[]` read from
  `itemDef.componentIds` and a no-op method `attemptSeparate(): boolean`
  that currently always returns `false` and logs
  `"Cluster B not implemented — see PRD Section 3"`. This exists purely so
  a future implementer has a documented entry point instead of having to
  re-read the whole PRD to figure out where separation logic would plug in.
- DoD: the stub compiles, does nothing observable in gameplay, and is
  clearly commented as a future-work seam.

**G.3 — Document the future digital redesign notes inline**
- File: `docs/DEFERRED_MECHANICS.md`
- Action: copy the PRD's Cluster B and Cluster C descriptions verbatim into
  this doc along with the specific digital-redesign suggestions already in
  the PRD (drag-to-separate gesture, tap-and-hold "tip the can" animation,
  post-round correction overlay), so a future contributor doesn't need to
  dig through the original PRD.
- DoD: doc exists and matches PRD Section 3's deferred content.

---

## 10. Track H — Municipal DB Integration Stub (PRD Section 7, Idea A)
**Status: adopted in the PRD but explicitly long-term/low-priority relative
to MVP tracks above.** **Owner:** anyone, whenever capacity allows.

**H.1 — Define the mock API contract**
- File: `src/services/MunicipalPolicyService.ts`
- Action: `interface PolicyUpdate { itemId: string; newCorrectBinId: string; effectiveDate: string }`
  and a method `async fetchPolicyUpdates(): Promise<PolicyUpdate[]>` that,
  for now, reads from a local mock file `src/data/mockPolicyUpdates.json`
  instead of a real network call (no real municipal API exists to integrate
  with yet).
- DoD: calling `fetchPolicyUpdates()` returns the mock array; a unit test
  confirms the shape matches the interface.

**H.2 — Apply policy updates to `items.json` at runtime**
- File: `src/services/MunicipalPolicyService.ts`
- Action: `applyUpdates(items: TrashItemDef[], updates: PolicyUpdate[]): TrashItemDef[]`
  — pure function, returns a new array with matching `itemId`s having their
  `correctBinId` overwritten. Called once at `BootScene` startup after
  loading `items.json`, before anything else consumes item data.
- DoD: unit test — given one item and one matching update, the returned
  array has the updated `correctBinId`; non-matching items are untouched
  (object identity or deep-equal check).

**H.3 — Document real integration path (no implementation yet)**
- File: `docs/FUTURE_INTEGRATIONS.md`
- Action: note that a real implementation would replace the mock file read
  in H.1 with an actual `fetch()` call to a city API once one is identified,
  and would need an "overnight sync" scheduling mechanism (e.g., a cron-like
  check on app boot comparing a stored `lastSyncDate` against today).
  Explicitly note Idea B (Smart Grid/LCA) and Idea C (Global Expansion) from
  the PRD are not started at all — no stub needed, just tracked as backlog.
- DoD: doc exists, lists both unimplemented future ideas so they aren't lost.

---

## 11. Cross-Cutting: Accessibility Pass
**Owner:** anyone with remaining capacity, after Tracks B/C/D/E are merged.
Not in the original PRD but necessary given the core feedback loop relies on
red/green color coding (Section 3, Cluster C) which is a colorblindness risk.

**11.1 — Add shape/icon redundancy to correct/incorrect feedback**
- File: wherever the green/red flash from PRD Cluster C-equivalent lands
  (currently: the particle color choices in Track C step C.1, and any future
  Track G reticle flash)
- Action: pair every color-only signal with a shape signal — a checkmark
  icon on correct, an X icon on incorrect — so the feedback doesn't rely on
  color alone.
- DoD: with a colorblindness simulation filter applied (e.g. Chrome DevTools
  Rendering tab → Emulate vision deficiencies → Deuteranopia), correct vs.
  incorrect drops remain distinguishable via the icon shapes alone.

---

## 12. Integration & QA Checklist (Run Before Any Public Demo)

- [ ] Fresh browser profile (no `localStorage`): only Level 1 unlocked, CHI 0.
- [ ] Complete a full round in Level 1 at beginner difficulty; timer, score,
      combo, particles, audio layering, and squash-stretch all fire correctly.
- [ ] Force 4 losing rounds in a row in one venue; confirm background
      degrades clean → grimy → ruined and does NOT affect other venues' CHI.
- [ ] Manually raise a venue's CHI past 40 (via repeated good rounds or
      direct `localStorage` edit for test speed); confirm Level 2 unlocks.
- [ ] Play at CHI 80+ in a venue; confirm 20s timer, 9 items/tray, no hint
      text, dual-drag works with two simulated pointers.
- [ ] Delete one item sprite file; confirm placeholder box renders for only
      that item, game does not crash.
- [ ] Run `npm run test`; all Vitest suites (scoring, combo, CHI, difficulty
      tier boundaries, policy update merge) pass.
- [ ] Run `npm run lint`; zero errors.
- [ ] Colorblindness simulation check (Section 11) passes.
- [ ] Performance: Chrome DevTools Performance panel shows steady 60fps
      during a 9-item expert-tier round with particles + screen shake active.

---

## 13. Milestone / Sprint Sequencing

| Sprint | Tracks Active | Exit Criteria |
|---|---|---|
| Sprint 1 | Track 0 (solo, ~1 day), then Track A + Track F kick off in parallel | `track-a-complete` and `track-f-complete` (F.1–F.5; F.6/F.7 can lag) tagged |
| Sprint 2 | Track B | `track-b-complete` tagged; playable unstyled round on `main` |
| Sprint 3 | Track C + Track D **in parallel** (different people, no file overlap per Section 1.4) | `track-c-complete` and `track-d-complete` both tagged |
| Sprint 4 | Track E (needs C+D); Track F.6/F.7 art delivery continues in background; Track G/H picked up if capacity allows | `track-e-complete` tagged; real art present for at least Level 1 |
| Sprint 5 | Section 11 accessibility pass; Section 12 full QA checklist; bug-fix buffer | All Section 12 checklist items pass |

**Parallelization note for a multi-agent Claude Code setup specifically:**
Sprint 3 is the clearest opportunity to run two Claude Code instances
simultaneously with zero merge conflicts, since Track C only ever touches
`src/systems/ParticleFXManager.ts`, `AudioLayerManager.ts`, and adds
subscription code to `HUDScene.ts`/`TrayScene.ts`/`Bin.ts`, while Track D
only ever touches `src/systems/ChiSystem.ts`, `VenueDecayState.ts`,
`src/scenes/LevelSelectScene.ts`, and reads (does not write) the same
`TrayScene.ts` — assign Track D's `TrayScene.ts` edits to happen in a
clearly separate diff hunk (background-swap logic only, step D.5) to keep
merge conflicts trivial.

---

## 14. Open PRD Items Mapped to Owning Track

| Open Item (from PRD Appendix) | Owning Track | Status in This Plan |
|---|---|---|
| Finalize descriptive adjective for the game | Not a code task — flag to whoever owns copy/marketing, unrelated to any Track | Unresolved, out of engineering scope |
| Source human/environmental harm statistics | Not a code task | Unresolved, out of engineering scope |
| Confirm sprite resolution/canvas size | Track F | **Resolved** — locked in Section 1.2 |
| Decide on Cluster B/C digital redesign timing | Track G | Stubbed, not activated (G.1–G.3) |
| Level 2 Shredder / Level 3 dual-wielding dependency on Cluster B | Track G / Track E | Dual-wielding implemented independently in E.5 (does not actually need Cluster B — it's a multi-pointer input feature, not a pre-treatment feature); Shredder mechanic remains genuinely blocked on Cluster B per G.2 |
| Saboteur & Power-Ups priority/timeline | Not started | No Track owns this yet — add as a new Track I if greenlit |
| Revisit Smart Grid/LCA Integration | Track H | Documented only (H.3), not implemented |

---

*End of implementation plan. Every mini-step above has a file path and an
objective Definition of Done — if any contributor (human or Claude Code
instance) hits a step where the DoD can't be checked without guessing, that's
a documentation bug in this plan, not a signal to improvise.*