# Architecture

Solo Goalie Trainer is a single-page React app with no backend. All state lives in the browser (`localStorage`), and the build is a static bundle served from GitHub Pages.

---

## High-level shape

```
index.html ──> src/main.jsx ──> <App/>
                                  │
        screen-state navigation (no router)
                                  │
   ┌───────────────┬─────────────┴───────────────┬──────────────────┐
ProfileSelect   DrillSelect     DrillRunner    SessionHistory    AdminDashboard
   │                                │                                  │
   └──────────── reads/writes ──────┴──────────── reads/writes ────────┘
                                  │
                      src/data/ (store, drills, sessions)  +  src/audio.js
```

`App.jsx` holds the current screen and the selected profile/drill in component state and swaps screens — there is intentionally no router or global store. Data access is centralized in three small modules.

---

## Data modules (`src/data/`)

### `store.js` — profiles, drills, settings

- CRUD for **profiles** and **drills**, backed by `localStorage` keys (`sgt-profiles`, `sgt-drills`).
- **Settings**: theme, cue speech rate (clamped 0.6–1.6), diagram perspective (`goalie`/`shooter`), onboarding flag.
- **Versioned drill migration.** `DRILLS_VERSION` is bumped whenever the built-in drills change. On load, `migrateDrills()` refreshes the built-in drills (matched by `id`) to the current defaults while **preserving any coach-created custom drills**, then appends any newly added defaults. This lets existing testers receive content updates without losing their own drills.

### `drills.js` — drill data + cue generation

- **Zones**: an 8-cell goal grid (`ZONE_GRID`) — High/Mid/Low × Stick-Side/Center/Off-Stick (Mid has no center cell; the center column is High Center, 5-Hole, and the two mid side cells).
- **Cones** mark **where the shooter shoots from**, as absolute field positions: `SHOOTER_POSITIONS = ['Left Pipe','Left 45','Top Center','Right 45','Right Pipe']`. A cone is `{ color, shotFrom, position }` where `position` (0–4) is the absolute slot.
- **Shot types**: Direct, Bounce shot, Sidearm, Skip shot, Overhand.
- **Cue generation** (`generateCueText`, `passCueStages`) is **level-aware**:
  - L1 (Beginner): full cue + a coaching technique tip.
  - L2 (Intermediate): zone/cone + shot type, no technique.
  - L3 (Advanced): minimal (zone or cone only).
  - L4 (Game Speed): `null` → the runner plays a tone instead of speech.
- **Technique cues are drill-aware.** Off-stick footwork is a *wide lateral save step* on a straight perimeter shot, but a *drop step to re-square* after a feed (combined / pass drills). See `techniqueFor()`.
- **Level scaling**: `getIntervalSeconds()` multiplies the drill's base interval by a per-level factor (1.0 / 0.75 / 0.625 / 0.5), so higher levels are faster.
- **Per-field randomization**: `randomizeRep()` replaces selected rep fields (cone, zone, shot type) with random valid picks while preserving the rep shape (including distinct from/to cones for pass reps).

### `sessions.js` — history & promotion

- Logs completed sessions and computes **level promotion** from history (stored level override per profile + level type).
- **CSV import/export** with de-duplication (`addSessionsDeduped`) keyed on a session signature.
- **Cascade delete** of a profile's sessions.

---

## Drill & rep model

A drill is:

```js
{
  id, name, type,            // 'shot-reaction' | 'cone' | 'combined' | 'pass'
  levelType,                 // which profile level applies ('shot-reaction' | 'cone')
  description, intervalSeconds,
  cones: [{ color, shotFrom, position }],
  reps: [ /* shape depends on type */ ]
}
```

Rep shapes by type:

| Type | Rep shape | Cue |
|---|---|---|
| `shot-reaction` | `{ zone, shotType }` | spoken zone + shot |
| `cone` | `{ cone }` | spoken cone color + shooting position |
| `combined` | `{ cone, zone, shotType }` | cone, then shot |
| `pass` | `{ coneFrom, coneTo, zone, shotType }` | **two stages** (see below) |

### Pass drills — two-stage delivery

Pass drills deliver each rep in two stages, driven by `DrillRunner`:

1. **Feed stage** — speak the origin cone (`passCueStages().first`); highlight the origin cone; goal zone hidden.
2. **2-second pause** (fixed, independent of level scaling) — the "feed across the crease."
3. **Shot stage** — speak the receiving cone + shot (`.second`); draw the feed arrow to the receiving cone; reveal the goal zone.

`DrillRunner.announceRep()` centralizes this so the timer loop, manual-tap, and the first rep after countdown all behave identically. A `passTimerRef` holds the pending 2s timeout and is cleared on Back/done.

---

## Audio (`src/audio.js`)

- A **single shared `AudioContext`** (lazily created) and a centralized `speak()` / `playTone()`.
- `speak()` reads the user's speech-rate setting at call time.
- **iOS unlock**: `warmUpAudio()` is invoked inside the Start tap gesture — it resumes the context, plays a silent blip, and speaks a silent utterance. Without this, iOS Safari blocks audio/speech that isn't tied to a user gesture.

---

## Diagrams

- **`GoalDiagram`** — SVG 8-zone net. Column mapping is handedness- and perspective-aware (`stickRendersLeft(handedness, perspective)`): goalie (egocentric) vs shooter (field) view.
- **`ConeDiagram`** — places cones along a shallow arc by their absolute `position` slot (no mirroring — the position labels are absolute). For pass drills it draws a dashed **feed arrow** from the origin cone to the active receiving cone.

---

## PWA & offline

- `public/manifest.webmanifest` + `public/sw.js`.
- Service worker is **cache-first for assets**, **network-first for navigations**.
- `beforeinstallprompt` drives an install banner (Android/desktop); iOS shows an Add-to-Home-Screen tip.
- `vite.config.js` sets `base: './'` so the bundle works under the Pages subpath.

> **Caching caveat:** because assets are cache-first, a device already running the app may need one hard refresh after a deploy to pick up new code.

---

## Testing & CI

- Vitest + jsdom; suites under `src/data/*.test.js` and `src/audio.test.js`.
- `.github/workflows/deploy.yml` runs `npm ci` → `npm run test` → `npm run build` → deploy to Pages on push to `main`. A failing test blocks the deploy.

See [TEST_PLAN.md](TEST_PLAN.md) for coverage and the manual QA checklist.
