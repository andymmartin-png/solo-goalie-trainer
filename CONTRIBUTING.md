# Contributing

This is a small solo-developer project, but these conventions keep it consistent.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173
```

Node 20+ (CI uses Node 24).

## Workflow

1. Branch off `main` (or work locally) and make your change.
2. Run the test suite: `npm run test`. Add or update tests for any logic change in `src/data/` or `src/audio.js`.
3. Verify in the browser — for previewable changes, run the app and confirm the behavior.
4. Run a production build (`npm run build`) before pushing; CI gates the deploy on tests **and** build.
5. Commit and push to `main` to deploy.

## Conventions

- **No new dependencies** without a good reason — the app is intentionally framework-light (React + Vite, plain CSS).
- **Styling**: plain CSS in `src/index.css` using the existing CSS custom properties (`--bg`, `--accent`, etc.). Match the surrounding style.
- **State**: keep navigation as screen-state in `App.jsx`; keep data access in `src/data/`. Don't add a router or global store.
- **Cue text** lives in `drills.js` (`generateCueText`, `passCueStages`, `TECHNIQUES`). Keep cues short — they're spoken aloud during a timed rep.
- **Tests**: unit-test pure logic (cue generation, level scaling, randomization, sessions, store migration). Components are verified manually via the preview.

### Drill content changes

The app caches drills in `localStorage`. If you change the **built-in** drills (`DEFAULT_DRILLS` in `drills.js`), **bump `DRILLS_VERSION`** in `store.js` so existing users' caches migrate. `migrateDrills()` refreshes built-ins by `id` and preserves custom drills. Update the version assertion in `store.test.js` to match.

## Commit messages

- Imperative subject line, body explaining the *why*.
- This project co-authors AI-assisted commits:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```

## Deploying

Push to `main`. `.github/workflows/deploy.yml` runs tests, builds, and publishes to GitHub Pages. After a deploy, testers may need one hard refresh (service-worker cache).
