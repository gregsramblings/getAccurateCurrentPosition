# getAccurateCurrentPosition()

A tiny, dependency-free enhancement to [`navigator.geolocation`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API) that returns a **more accurate and predictable** location than a single `getCurrentPosition()` call.

It works in any geolocation-enabled web browser and in PhoneGap/Cordova apps (which use the same underlying HTML geolocation APIs). Tested on desktop Chrome, Safari, and Firefox, and on iOS and Android devices.

🔗 **[Live demo](https://gregsramblings.github.io/getAccurateCurrentPosition/)** · [Source on GitHub](https://github.com/gregsramblings/getAccurateCurrentPosition)

## The problem

`navigator.geolocation.getCurrentPosition()` returns the *first* fix the device can produce. If the GPS hasn't been used recently in the current location, that first fix often comes from Wi-Fi or cell-tower triangulation and can be off by hundreds — sometimes thousands — of meters. You get a fast answer, but not necessarily an accurate one. Setting `enableHighAccuracy: true` doesn't fix this, because the callback still fires before the GPS hardware has had time to acquire satellites.

## The approach

Instead of `getCurrentPosition()`, this library uses [`navigator.geolocation.watchPosition()`](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition), which fires repeatedly as the device refines its reading. On a freshly booted device it typically takes a handful of callbacks to converge on a good fix. `getAccurateCurrentPosition()` watches those updates and resolves as soon as a reading meets your desired accuracy — or returns the best reading it saw once a time limit is reached.

## Usage

Include the script — it attaches `getAccurateCurrentPosition` onto `navigator.geolocation`:

```html
<script src="geo.js"></script>
```

Then call it. The signature mirrors `getCurrentPosition()`, with an added progress callback:

```js
navigator.geolocation.getAccurateCurrentPosition(
  onSuccess,
  onError,
  onProgress,
  { desiredAccuracy: 20, maxWait: 15000 }
);

function onSuccess(position) {
  // Fires when desiredAccuracy is met OR maxWait elapses (see note below).
  console.log(position.coords.latitude, position.coords.longitude);
  console.log('accuracy:', position.coords.accuracy, 'meters');
}

function onError(error) {
  // Standard GeolocationPositionError (code 1/2/3) or, on timeout with no
  // fix at all, { code: 3, message: ... }.
  console.error(error.code, error.message);
}

function onProgress(position) {
  // Optional. Called on each interim reading that didn't yet meet the target.
  console.log('interim accuracy:', position.coords.accuracy, 'm');
}
```

`onError` and `onProgress` are optional — pass `null` (or omit) if you don't need them.

## Options

These extend the standard `getCurrentPosition()` options:

| Option | Default | Description |
| --- | --- | --- |
| `desiredAccuracy` | `20` | The accuracy in meters you consider "good enough". The first reading at or below this resolves `onSuccess`. |
| `maxWait` | `10000` | How long to keep trying, in milliseconds, before giving up and returning the best reading so far. |

The following standard options are **set for you** and cannot be overridden:

| Option | Forced value | Why |
| --- | --- | --- |
| `timeout` | `maxWait` | Aligns the watch timeout with how long you're willing to wait. |
| `enableHighAccuracy` | `true` | The whole point of this function. |
| `maximumAge` | `0` | We only want fresh readings, never a cached position. |

> **Note:** `desiredAccuracy` is *desired*, not *required*. If `maxWait` elapses before it's met, `onSuccess` still fires with the most accurate reading collected — so check `position.coords.accuracy` if your use case truly requires the threshold. `onError` only fires on an actual geolocation error, or if `maxWait` elapses without **any** reading at all (code `3`, timeout).

## Behavior details

- **The first reading is ignored for the accuracy check** (unless it's the only one received). Some devices emit a cached position on the first event even with `maximumAge: 0`, so this avoids returning stale data. That first reading is still reported via `onProgress`.
- **Callbacks fire at most once.** Late `watchPosition` events arriving after success or timeout are ignored, so `onSuccess`/`onError` never double-fire.

## Files

| File | Purpose |
| --- | --- |
| [`geo.js`](geo.js) | The library — the only file you need. |
| [`demo.html`](demo.html) | Live demo against your device's real GPS. |
| [`test.html`](test.html) | 10 automated tests (mocked geolocation); open in any browser. |
| [`index.html`](index.html) | Landing page linking the demo and tests. |

## Roadmap

Planned and under consideration. Contributions and opinions welcome — open an issue.

**Modern API**
- [ ] **Promise support** — call without callbacks to get a `Promise<GeolocationPosition>` back; `onProgress` moves into the options object. The existing positional-callback form keeps working.
- [ ] **Cancellation** — accept an `AbortSignal` so a pending request can be cancelled (e.g. on component unmount).

**TypeScript**
- [ ] **Type definitions** — ship a `.d.ts` augmenting `navigator.geolocation`, with an accurate error type (the timeout-with-no-fix case resolves to `{ code: 3, message }`, not a real `GeolocationPositionError`).

**Distribution**
- [ ] **npm package** — publish as `get-accurate-current-position` with ESM + CJS + global builds and bundled types. *(This is the decision that shapes how Promises and TS ship — see note below.)*

**Behavior & options**
- [ ] **Return the best fix, not the last** — on timeout, return the most accurate reading seen rather than the most recent one.
- [ ] **`maxSamples` option** — stop after N readings regardless of time or accuracy.
- [ ] **Early exit on convergence** — resolve once accuracy stops improving, instead of always waiting out `maxWait`.

**Project health**
- [ ] **Headless tests + CI** — run the existing mocked suite under a headless runner with GitHub Actions.

> **Direction:** Promises and TypeScript are most useful once the library is an npm package with bundled types. If we keep it a copy-the-script library instead, TypeScript ships as a hand-included `geo.d.ts` and Promises just work via the global. Deciding npm vs. script-only first will sequence everything else.

## License

[MIT](LICENSE)
