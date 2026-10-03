# DeenTime testing

## Automated validation

Run:

~~~text
npm test
~~~

This executes:

~~~text
node tests/praytimes.test.js
node tests/phase6.test.js
node tests/phase7.test.js
node tests/phase8.test.js
node tests/phase9.test.js
node tests/phase10.test.js
node tests/phase11.test.js
~~~

The checks are deterministic and do not depend on live geolocation, device sensors, external APIs, or notification services.

## Manual smoke test

Serve the repository:

~~~text
python -m http.server 8000
~~~

Verify:

- prayer times render from the saved/default location and selected timezone
- calculation method, madhab, time format, and theme persist after reload
- next prayer and countdown update correctly through prayer transitions
- fixed Qibla direction works when orientation is unavailable
- location permission is requested only from the explicit location action
- manual coordinates and IANA timezone validate and persist
- Hijri and Gregorian dates remain aligned around month/year boundaries
- Tasbih state persists and reset clears local state
- Names search and name detail interaction work with keyboard input
- browser zoom remains available
- service-worker shell fallback works after a successful online load
- core app works after the network is disabled
- notification permission remains optional

## Release verification

1. Run `npm test`.
2. Inspect `manifest.json` and all referenced icons.
3. Open DeenTime in a clean browser session.
4. Load once online, then disable the network and reload.
5. Confirm the prayer-time and worship-tool core experience remains available.
6. Confirm no GitHub Actions workflow exists.
7. Confirm `VERSION` and `CACHE_VERSION` match.
