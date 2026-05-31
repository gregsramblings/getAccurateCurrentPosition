// Cloudflare Worker that hosts a small UI for testing
// navigator.geolocation.getAccurateCurrentPosition.
//
// Routes:
//   GET /        -> HTML page with parameter inputs and a run button
//   GET /geo.js  -> the library source (so the HTML can <script src> it)
//
// Deploy:
//   cd worker && npx wrangler deploy

const GEO_JS = `navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {
    var lastCheckedPosition,
        locationEventCount = 0,
        watchID,
        timerID;

    options = options || {};

    var done = false;

    var checkLocation = function (position) {
        if (done) return;
        lastCheckedPosition = position;
        locationEventCount = locationEventCount + 1;
        // We ignore the first event unless it's the only one received because some devices seem to send a cached
        // location even when maximumAge is set to zero
        if ((position.coords.accuracy <= options.desiredAccuracy) && (locationEventCount > 1)) {
            clearTimeout(timerID);
            navigator.geolocation.clearWatch(watchID);
            foundPosition(position);
        } else if (geoprogress) {
            geoprogress(position);
        }
    };

    var stopTrying = function () {
        if (done) return;
        navigator.geolocation.clearWatch(watchID);
        if (lastCheckedPosition) {
            foundPosition(lastCheckedPosition);
        } else {
            geolocationError({ code: 3, message: "Timeout expired before any position was acquired." });
        }
    };

    var onError = function (error) {
        if (done) return;
        done = true;
        clearTimeout(timerID);
        navigator.geolocation.clearWatch(watchID);
        geolocationError(error);
    };

    var foundPosition = function (position) {
        if (done) return;
        done = true;
        geolocationSuccess(position);
    };

    if (options.maxWait == null)         options.maxWait = 10000;
    if (options.desiredAccuracy == null) options.desiredAccuracy = 20;
    if (options.timeout == null)         options.timeout = options.maxWait;

    options.maximumAge = 0;
    options.enableHighAccuracy = true;

    watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    timerID = setTimeout(stopTrying, options.maxWait);
};
`;

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>getAccurateCurrentPosition tester</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { font: 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 640px; margin: 1em auto; padding: 1em; line-height: 1.4; }
  h1 { margin: 0 0 0.3em; font-size: 1.4em; }
  .lead { color: #666; margin: 0 0 1.5em; }
  fieldset { border: 1px solid #ddd; border-radius: 8px; padding: 1em; margin: 0 0 1em; }
  legend { padding: 0 0.5em; font-weight: 600; color: #2a6df4; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; }
  .row { display: flex; gap: 1em; }
  .row label { flex: 1; font-size: 0.9em; color: #444; }
  input[type=number] { font: inherit; padding: 0.5em; width: 100%; margin-top: 0.25em; border: 1px solid #ccc; border-radius: 6px; }
  button { font: 600 16px -apple-system, BlinkMacSystemFont, sans-serif; padding: 0.9em 1.5em; background: #2a6df4; color: white; border: 0; border-radius: 8px; -webkit-appearance: none; cursor: pointer; width: 100%; }
  button:disabled { opacity: 0.5; }
  pre.result { padding: 0.75em; margin: 0.5em 0 0; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
  pre.success { background: #eafaf1; border-left: 4px solid #2ecc71; color: #145a32; }
  pre.error { background: #fdecea; border-left: 4px solid #e74c3c; color: #922b21; }
  .progress { padding: 0.5em 0.75em; margin: 0.4em 0; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; background: #fef5e7; border-left: 4px solid #f39c12; color: #7d5108; }
  .map-link { display: inline-block; margin-top: 0.6em; padding: 0.6em 0.9em; background: #2a6df4; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
  .perm { display: inline-block; padding: 0.1em 0.5em; border-radius: 4px; font-size: 0.85em; font-family: ui-monospace, monospace; }
  .perm.granted { background: #d4efdf; color: #145a32; }
  .perm.prompt { background: #fef9e7; color: #7d5108; }
  .perm.denied { background: #fadbd8; color: #922b21; }
  .perm.unavailable, .perm.checking { background: #eaeded; color: #555; }
  small { color: #888; display: block; margin-top: 1.5em; font-size: 12px; line-height: 1.5; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.9em; }
  @media (prefers-color-scheme: dark) {
    body { background: #1c1c1e; color: #ddd; }
    .lead, small { color: #aaa; }
    .row label { color: #ccc; }
    fieldset { border-color: #444; }
    input { background: #2c2c2e; color: white; border-color: #444; }
    pre.success { background: #14322a; color: #a3e6c1; }
    pre.error { background: #3a1a18; color: #f5b7b1; }
    .progress { background: #3a2e17; color: #f7ca84; }
    .perm.unavailable, .perm.checking { background: #2c2c2e; color: #aaa; }
  }
</style>
</head>
<body>
<h1>getAccurateCurrentPosition</h1>
<p class="lead">Permission: <span id="perm" class="perm checking">checking</span></p>

<fieldset>
  <legend>Parameters</legend>
  <div class="row">
    <label>desiredAccuracy (m)<input id="accuracy" type="number" value="20" min="1" inputmode="numeric"></label>
    <label>maxWait (seconds)<input id="maxwait" type="number" value="15" min="1" inputmode="numeric"></label>
  </div>
</fieldset>

<button id="go">Get accurate position</button>

<div id="status"></div>
<div id="updates"></div>

<small>
  Each entry below is a single <code>watchPosition</code> callback.
  The library returns the first reading whose accuracy meets your threshold
  (after ignoring a possibly-cached first reading), or the last reading
  it saw when <code>maxWait</code> elapses.
</small>

<script src="/geo.js"></script>
<script>
(async function () {
  var permEl = document.getElementById('perm');
  if (navigator.permissions && navigator.permissions.query) {
    try {
      var p = await navigator.permissions.query({ name: 'geolocation' });
      var update = function () {
        permEl.textContent = p.state;
        permEl.className = 'perm ' + p.state;
      };
      update();
      p.onchange = update;
    } catch (e) {
      permEl.textContent = 'unavailable';
      permEl.className = 'perm unavailable';
    }
  } else {
    permEl.textContent = 'unavailable';
    permEl.className = 'perm unavailable';
  }

  var btn = document.getElementById('go');
  var status = document.getElementById('status');
  var updates = document.getElementById('updates');

  btn.addEventListener('click', function () {
    btn.disabled = true;
    status.innerHTML = '';
    updates.innerHTML = '';

    if (!navigator.geolocation || !navigator.geolocation.getAccurateCurrentPosition) {
      var pre = document.createElement('pre');
      pre.className = 'result error';
      pre.textContent = 'getAccurateCurrentPosition not loaded (geo.js failed to load).';
      status.appendChild(pre);
      btn.disabled = false;
      return;
    }

    var desiredAccuracy = parseFloat(document.getElementById('accuracy').value);
    var maxWait = parseFloat(document.getElementById('maxwait').value) * 1000;
    var t0 = Date.now();

    navigator.geolocation.getAccurateCurrentPosition(
      function onSuccess(pos) {
        var dt = ((Date.now() - t0) / 1000).toFixed(1);
        var c = pos.coords;
        var met = c.accuracy <= desiredAccuracy ? 'met threshold' : 'best available at timeout';
        var fmt = function (v, unit) { return v != null ? v + ' ' + unit : 'n/a'; };
        var lines = [
          'SUCCESS after ' + dt + 's (' + met + ')',
          '',
          'latitude:          ' + c.latitude,
          'longitude:         ' + c.longitude,
          'accuracy:          ' + c.accuracy + ' m',
          'altitude:          ' + fmt(c.altitude, 'm'),
          'altitudeAccuracy:  ' + fmt(c.altitudeAccuracy, 'm'),
          'heading:           ' + fmt(c.heading, 'deg'),
          'speed:             ' + fmt(c.speed, 'm/s')
        ];
        var pre = document.createElement('pre');
        pre.className = 'result success';
        pre.textContent = lines.join('\\n');
        status.appendChild(pre);
        var a = document.createElement('a');
        a.className = 'map-link';
        a.target = '_blank';
        a.rel = 'noopener';
        a.href = 'https://www.google.com/maps?q=' + c.latitude + ',' + c.longitude;
        a.textContent = 'View on Google Maps';
        status.appendChild(a);
        btn.disabled = false;
      },
      function onError(err) {
        var names = { 1: 'PERMISSION_DENIED', 2: 'POSITION_UNAVAILABLE', 3: 'TIMEOUT' };
        var name = names[err.code] || ('CODE ' + err.code);
        var pre = document.createElement('pre');
        pre.className = 'result error';
        pre.textContent = 'ERROR: ' + name + (err.message ? '\\n' + err.message : '');
        status.appendChild(pre);
        btn.disabled = false;
      },
      function onProgress(pos) {
        var dt = ((Date.now() - t0) / 1000).toFixed(1);
        var div = document.createElement('div');
        div.className = 'progress';
        div.textContent = '+' + dt + 's   accuracy: ' + pos.coords.accuracy + ' m';
        updates.appendChild(div);
      },
      { desiredAccuracy: desiredAccuracy, maxWait: maxWait }
    );
  });
})();
</script>
</body>
</html>`;

export default {
  async fetch(request) {
    const { pathname } = new URL(request.url);

    if (pathname === '/geo.js') {
      return new Response(GEO_JS, {
        headers: {
          'content-type': 'application/javascript; charset=utf-8',
          'cache-control': 'public, max-age=3600'
        }
      });
    }

    return new Response(HTML, {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache'
      }
    });
  }
};
