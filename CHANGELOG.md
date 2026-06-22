# Changelog

All notable changes to Solo Goalie Trainer. Dates are the development dates of the prototype.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/). This project is pre-1.0; the version stays `0.1.0` while the prototype iterates.

## [Unreleased]

_No unreleased changes._

## 0.1.0 — Prototype

### 2026-06-22

- **Two-stage pass cues & five-cone Crease Feed drill.** Pass drills now call the origin cone, pause 2 seconds (the feed across the crease), then call the receiving cone + shot. The built-in "Crease Feed Reaction" drill uses all five shooting positions. (`DRILLS_VERSION` → 4)
- **Pass + Shot drill type.** New drill type chaining a cross-crease feed (`coneFrom → coneTo`) into a shot, with a feed-arrow diagram and a seed drill. (`DRILLS_VERSION` → 3)
- **Per-field randomization.** Independent toggles to randomize cone, net zone, and shot type per rep, distinct from order shuffling.
- **Research-based technique cues.** Save-technique tips updated to match coaching-research consensus (hands first, stay square, drop the knee on five-hole, chest over stick on low shots). Off-stick footwork is now drill-aware: wide save step on perimeter shots, drop step to re-square after a feed.
- **Cones model shooting positions.** Cones now represent where the shooter shoots from (Left Pipe, Left 45, Top Center, Right 45, Right Pipe) rather than save locations. (`DRILLS_VERSION` → 2)
- **Install prompt & feedback button** added to the profile screen.

### 2026-06-21

- **CI build bumped to Node 24.**
- **Adjustable cue speech speed** with a live preview in the voice picker.
- **iOS audio/speech warm-up** on the Start tap so cues play on iOS Safari.
- **Vitest pinned to 2.x** for Vite 5 compatibility; lockfile regenerated (fixes a CI `npm ci` failure).
- **Initial prototype.** React + Vite PWA with profiles, drill types (shot-reaction, cone, combined), 8-zone goal diagram, cone map, four difficulty levels, timer/tap pacing, session history, Coach Mode (profile/drill CRUD, CSV import/export), light/dark theme, goalie/shooter perspective, localStorage persistence, service worker + manifest, and a GitHub Pages deploy workflow.
