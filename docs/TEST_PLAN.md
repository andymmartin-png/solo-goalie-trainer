# Test Plan

Covers automated coverage and a manual QA checklist for Solo Goalie Trainer. Run automated tests with `npm run test` (Vitest + jsdom). Manual checks are done in the browser preview and on a real phone (the audio + PWA behavior can't be fully verified in jsdom).

---

## 1. Automated tests

Location: `src/data/*.test.js`, `src/audio.test.js`. ~59 tests across 4 files.

| Suite | What it covers |
|---|---|
| `drills.test.js` | Cue generation per drill type and level (shot-reaction, cone, combined, **pass two-stage**); drill-aware off-stick footwork (wide step vs drop step); per-field `randomizeRep` (valid picks, distinct pass from/to, preserved shape); level interval scaling; level resolution (profile vs stored override); perspective × handedness mapping; zone/grid data integrity. |
| `sessions.test.js` | Session logging; level promotion; CSV round-trip; de-duplication on import; cascade delete. |
| `store.test.js` | Profile/drill CRUD; **drill migration** (built-ins refreshed, custom drills preserved, version bumped); settings (perspective, speech rate clamp, theme, onboarding). |
| `audio.test.js` | Centralized audio helpers (rate read from settings, etc.). |

**When adding logic**, add a unit test alongside it. Pure functions in `src/data/` and `src/audio.js` should be covered; component behavior is verified manually.

**Gotcha:** changing built-in drills requires bumping `DRILLS_VERSION` and updating the version assertion in `store.test.js`.

---

## 2. Manual QA checklist

### Onboarding & profiles
- [ ] First load shows seeded profiles; onboarding appears once.
- [ ] Create / rename / delete a profile (Coach Mode).
- [ ] Handedness flips the goal-diagram stick-side column.

### Drill selection & running
- [ ] Each drill type starts and runs to completion: **shot-reaction, cone, combined, pass**.
- [ ] 3-2-1 countdown plays tones; first cue fires on "go."
- [ ] Timer mode advances on the interval; manual-tap mode advances on tap.
- [ ] Interval adjuster changes rep spacing.
- [ ] Rep-count presets (8/12/16/20/All/Custom) produce the right number of reps.
- [ ] "Shuffled" changes rep order; **Randomize Cone/Net/Shot** change rep values.
- [ ] Back mid-drill stops audio and the timer (no lingering speech).

### Pass drills (two-stage)
- [ ] Stage 1 speaks only the **origin** cone; origin cone highlighted; goal zone hidden.
- [ ] After ~2s, stage 2 speaks the **receiving** cone + shot; feed arrow drawn; goal zone revealed.
- [ ] Cone badge follows the called cone (origin → receiver).
- [ ] "Crease Feed Reaction" uses all five cone positions.

### Levels
- [ ] L1 includes a technique tip; L2 drops it; L3 is minimal; **L4 is a tone only** (no speech).
- [ ] Higher levels run faster (shorter interval).
- [ ] Off-stick technique says **wide step** in shot-reaction and **drop step** in combined/pass.

### Diagrams & settings
- [ ] Goalie vs shooter **perspective** mirrors the goal diagram correctly.
- [ ] **Cue speed** slider audibly changes speech rate; Test button works.
- [ ] Light/dark theme toggles and persists.

### History & Coach Mode
- [ ] Completing a drill logs a session; history screen shows it.
- [ ] Level auto-promotes after qualifying sessions.
- [ ] Build a custom drill of each type (incl. a 2-cone pass drill); it runs correctly.
- [ ] Renaming a cone color re-points its reps (no blank dropdowns / phantom colors).
- [ ] CSV export downloads; import to a chosen goalie de-dupes; deleting a profile cascades its sessions.

### Audio (real device — especially **iPhone Safari**)
- [ ] First Start tap unlocks audio; cues are audible (not silent).
- [ ] Speech and tones play through a phone speaker and Bluetooth.

### PWA / offline
- [ ] Install prompt (Android/desktop) or Add-to-Home-Screen tip (iOS) appears and is dismissible.
- [ ] Installed app launches standalone and **runs offline**.
- [ ] After a new deploy, one hard refresh loads the new build.

### Data resilience
- [ ] Corrupt/missing `localStorage` falls back gracefully (no crash).
- [ ] Existing tester on an older `DRILLS_VERSION` gets new built-in drills while keeping custom drills.

---

## 3. Pre-release smoke test

Before pushing to `main`:
1. `npm run test` — all green.
2. `npm run build` — clean build.
3. Run the app; complete one rep of each drill type with audio on.
4. Push; confirm the GitHub Actions deploy goes green.
