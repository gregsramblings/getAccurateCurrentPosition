# CLAUDE.md

Operating notes for agents working in this repo. See `README.md` for full usage docs
and the roadmap.

## What this is

`getAccurateCurrentPosition()` — a tiny, **dependency-free** enhancement to
`navigator.geolocation`. Instead of a single `getCurrentPosition()` call (which
returns the first, often Wi-Fi/cell-derived, fix), it uses `watchPosition()` and
resolves once a reading meets the desired accuracy, or returns the best reading seen
by the time limit. Works in any geolocation-enabled browser and in PhoneGap/Cordova.

## Files

| File | Purpose |
| --- | --- |
| `geo.js` | **The library — the only shipped code.** ~60 lines, vanilla JS, no build. |
| `test.html` | 10 automated tests using a **mocked** `navigator.geolocation`. Open in a browser; tests run on load. No GPS or network needed. |
| `demo.html` | Live demo against the device's **real** GPS. |
| `index.html` | Landing page linking the demo and tests. |
| `README.md` | Usage, options, behavior details, roadmap. |
| `LICENSE` | MIT. |

## No toolchain

No package.json, no dependencies, no bundler, no transpile step. Don't introduce one
casually — "copy the script" simplicity is a feature. (Going to npm/ESM/TypeScript is
on the roadmap but is a deliberate, sequencing decision — see the README "Direction"
note; confirm before starting it.)

## How `geo.js` works (and the invariants to preserve)

- Attaches itself: `navigator.geolocation.getAccurateCurrentPosition = function(...)`.
  Signature mirrors `getCurrentPosition()` plus an `onProgress` callback and extra
  options: `navigator.geolocation.getAccurateCurrentPosition(success, error, progress, options)`.
- **The first reading is ignored for the accuracy check** (`locationEventCount > 1`)
  unless it's the only one received — some devices emit a cached fix even with
  `maximumAge: 0`. Preserve this; it prevents returning stale data.
- A single **`done` guard** ensures `onSuccess`/`onError` fire **at most once**; late
  `watchPosition` events after success/timeout are ignored. Don't remove it.
- `maximumAge: 0` and `enableHighAccuracy: true` are **forced** and must not be
  overridable — they're the whole point. `timeout` defaults to `maxWait`.
- Defaults: `desiredAccuracy: 20` (meters), `maxWait: 10000` (ms).
- On `maxWait` timeout: returns the last checked position if any, else calls
  `onError` with `{ code: 3, message: ... }` (a plain object, not a real
  `GeolocationPositionError`).

## Testing

Open `test.html` in any browser — the mock installs **before** `geo.js` loads so the
library binds to the controlled object. After changing `geo.js`, re-run it and keep
all 10 green. There is no headless/CI runner yet (it's on the roadmap), so verify in a
browser. When you change behavior, add/adjust a matching mocked test.

## Conventions

- Keep `geo.js` vanilla ES5-ish and dependency-free for maximum embed compatibility
  (Cordova/older webviews). Match the existing style.
- Remote: `github.com/gregsramblings/getAccurateCurrentPosition`. Work happens via PRs
  (see git history); the live demo is published on GitHub Pages.
