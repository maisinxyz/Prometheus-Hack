# TrashDash: NYC Echo

A recycling sorting game that teaches NYC waste disposal through fast-paced,
juicy gameplay. Built with Phaser 3, TypeScript, and Vite.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Build for production
npm run build
```

## Tech Stack

| Layer            | Choice                                        |
|------------------|-----------------------------------------------|
| Game engine      | Phaser 3 (v3.80+)                             |
| Language         | TypeScript (strict mode)                      |
| Build tool       | Vite                                          |
| Audio            | Howler.js (layered-stem adaptive soundtrack)   |
| State management | Plain TypeScript singleton (`GameState`)       |
| Testing          | Vitest                                        |
| Linting          | ESLint + Prettier                             |

## Project Structure

```
trashdash/
├── src/
│   ├── main.ts                        # Phaser game bootstrap
│   ├── config/
│   │   ├── GameConfig.ts              # canvas size, physics, scale mode
│   │   └── ScoringConfig.ts           # point values, multiplier tables
│   ├── data/                          # JSON data schemas (Track A)
│   ├── scenes/
│   │   ├── BootScene.ts               # asset preload
│   │   ├── LevelSelectScene.ts        # venue picker (Track D)
│   │   ├── TrayScene.ts               # core disposal loop (Track B)
│   │   ├── CorrectionOverlayScene.ts  # stub, Track G
│   │   └── HUDScene.ts               # score/combo/timer overlay (Track B/C)
│   ├── entities/                      # game object classes (Track B/F)
│   ├── systems/                       # scoring, combo, CHI, audio (Tracks B-E)
│   ├── state/
│   │   └── GameState.ts               # singleton game state
│   └── util/
│       └── PlaceholderArtGenerator.ts  # placeholder sprite generator
├── assets/
│   ├── sprites/                       # items/, bins/, venues/, ui/
│   └── audio/                         # stems/, sfx/
├── tests/                             # Vitest test files
├── docs/                              # Art spec, deferred mechanics docs
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Git Branching Convention

Each Track works on its own feature branch following this naming pattern:

```
track/<letter>-<short-name>
```

**Examples:**
- `track/a-data-schemas`
- `track/b-disposal-loop`
- `track/c-juice`
- `track/d-chi-venues`
- `track/e-difficulty`
- `track/f-art-pipeline`
- `track/g-deferred-mechanics`
- `track/h-municipal-db`

### Integration Rules

1. Each Track works in isolation on its own branch.
2. Integration happens via **Pull Requests into `main`** in the order specified
   by the Track dependency graph:
   - Track 0 → Track A + Track F (parallel) → Track B → Track C + Track D (parallel) → Track E
3. Tracks G and H have no hard blockers and can be merged at any time.
4. Before merging, ensure:
   - `npm run build` passes with zero TypeScript errors.
   - `npm run test` passes all Vitest suites.
   - `npm run lint` passes with zero ESLint errors.

### Track Dependency Graph

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

Track G (Deferred Clusters B & C stubs) — no hard blockers, can start anytime.
```

## License

Private — Prometheus Hack project.