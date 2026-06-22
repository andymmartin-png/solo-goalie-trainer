# Solo Goalie Trainer 🥍

A mobile-first Progressive Web App that lets a lacrosse goalie run **reaction drills solo** — no coach, no shooter, no partner required. The app calls out cues by **audio and visual** (spoken zone/cone, a highlighted goal diagram, and a cone map), so the goalie can train footwork and reactions against a wall or in the backyard.

**Live app:** https://andymmartin-png.github.io/solo-goalie-trainer/

---

## What it does

- **Spoken + visual cues** — each rep is announced via text-to-speech and shown on an 8-zone goal diagram and a cone map.
- **Drill types**
  - **Shot Reaction** — react to a called net zone + shot type.
  - **Cone Drill** — shuffle/set to a called shooting position (cone).
  - **Combined** — step to a cone, then react to a called shot.
  - **Pass + Shot** — a two-stage cue: set to the first cone, then (after a 2-second feed pause) re-square to a second cone and react to the shot. Simulates a feed across the crease.
- **Four difficulty levels** (Beginner → Game Speed) that scale the interval and trim how much of the cue is spoken — at Game Speed it's a tone only.
- **Pacing** — automatic timer (adjustable interval) or manual tap.
- **Randomization** — shuffle rep order, and/or randomize individual fields (cone, net zone, shot type) per rep.
- **Per-goalie profiles** with handedness and independent shot-reaction / cone levels; levels auto-promote based on session history.
- **Session history** and a **Coach Mode** for managing athletes, building custom drills, and importing/exporting session data (CSV).
- **Adjustable cue speech speed**, light/dark theme, and a goalie-vs-shooter **perspective** setting for the diagrams.
- **Installable & offline** — full PWA with a service worker; works without a connection once installed.

A product requirements doc (PRD) and an end-user **User & Coach Guide** are maintained as separate Word documents (not in this repo).

---

## Tech stack

| Area | Choice |
|---|---|
| UI | React 18 |
| Build | Vite 5 |
| Styling | Plain CSS with custom properties (no framework) |
| Audio | Web Speech API (TTS) + Web Audio API (tones) |
| Persistence | `localStorage` (versioned migration) |
| Tests | Vitest + jsdom |
| Hosting | GitHub Pages via GitHub Actions |

No router and no global state library — navigation is screen-state in `App.jsx`, and data lives in small modules under `src/data/`.

---

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run test     # run the Vitest suite
npm run build    # production build to dist/
npm run preview  # preview the production build
```

Node 20+ recommended (CI builds on Node 24).

---

## Project structure

```
solo-goalie-trainer/
├─ public/
│  ├─ manifest.webmanifest   # PWA manifest
│  ├─ sw.js                  # service worker (cache-first assets, network-first nav)
│  └─ icon.svg               # app icon
├─ src/
│  ├─ App.jsx                # screen-state navigation
│  ├─ audio.js               # shared AudioContext, warm-up, speak()/playTone()
│  ├─ data/
│  │  ├─ drills.js           # drill data, cue generation, level scaling
│  │  ├─ store.js            # profiles/drills CRUD + settings, drill migration
│  │  └─ sessions.js         # session log, level promotion, CSV import/export
│  └─ components/            # screens & widgets (DrillRunner, DrillEditor, …)
├─ .github/workflows/deploy.yml
└─ vite.config.js            # base: './' for Pages subpath; Vitest config
```

For the data model, cue logic, and PWA details, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which runs the test suite, builds, and publishes `dist/` to GitHub Pages. A failed test blocks the deploy.

> **Note on updates:** the service worker caches the app for offline use. After a new deploy, a device already running the app may need **one hard refresh** to pick up the new build.

---

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design, data model, cue logic
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — automated coverage + manual QA checklist
- [CONTRIBUTING.md](CONTRIBUTING.md) — dev setup and conventions
- [CHANGELOG.md](CHANGELOG.md) — version history
- **PRD** and **User & Coach Guide** — maintained separately as Word documents (not in this repo)

---

## Status

Working prototype (v0.1.0) deployed for early user testing. Built as a solo-developer project; not affiliated with any league or governing body.
