# DeenTime

DeenTime is a lightweight, local-first Progressive Web App for prayer times and everyday Islamic worship utilities.

## Features

- Prayer times powered by the bundled PrayTimes.js calculation engine.
- Multiple calculation methods with Standard and Hanafi Asr settings.
- Explicit prayer location and IANA timezone controls.
- Exact next-prayer selection and second-by-second countdown, including the post-Isha transition to the next day's Fajr.
- Fixed Qibla direction with progressive device-compass support.
- Gregorian/Hijri calendar presentation with timezone-aware date handling.
- Digital Tasbih with persistent local state and selectable dhikr.
- Searchable, accessible 99 Names of Allah content.
- Installable PWA metadata with versioned offline caching.
- No account requirement, analytics, or backend.

## Privacy and local-first behavior

DeenTime stores settings, coordinates, timezone, calculation preferences, theme, and Tasbih state in browser local storage.

Location permission is requested only after the user activates **Detect My Location**. Coordinates are not sent to a reverse-geocoding service. When a place name is not available, DeenTime displays the coordinates.

Notification permission is optional and handled only from the notification setting. It is not required for prayer calculations.

## Architecture

~~~text
index.html
  |
  +-- praytimes.js           deterministic prayer calculation engine
  +-- names-of-allah.js      static Islamic content
  +-- script-core.js         settings, storage, location, common UI
  +-- phase4.js              next prayer and countdown
  +-- phase5.js              Qibla device capabilities
  +-- phase6.js              Hijri/calendar/time presentation
  +-- phase7.js              Tasbih state and accessibility
  +-- service-worker.js      PWA/offline lifecycle
~~~

The application remains framework-free. There is no backend.

## Local development

Serve the repository over HTTP so service-worker and permission APIs work correctly:

~~~sh
python -m http.server 8000
~~~

Then open http://localhost:8000 in a browser.

## Testing

Run the full deterministic suite:

~~~sh
npm test
~~~

The tests avoid live geolocation, device sensors, external APIs, and browser notification services.

## Contributing

DeenTime welcomes focused improvements to correctness, accessibility, privacy, documentation, and usability. Start with the [contributor guide](CONTRIBUTING.md) and browse [open issues](https://github.com/Aaqibhafeezkhan/DeenTime/issues).

## PWA and offline behavior

The service worker precaches the application shell and local icon assets. Navigation uses network-first behavior with a cached application-shell fallback. Local static assets use cache-first behavior with network refresh. External optional resources use network-first behavior with a runtime-cache fallback.

The service-worker cache is versioned using `CACHE_VERSION`. Updating the version during a release removes stale DeenTime caches and lets the application show a non-blocking update notice.

## Manual deployment and release

Production hosting targets Vercel. Deployment is manual and can be started from **Actions → Manual Deploy → Run workflow**. The workflow runs `npm test` before building and deploying to production; it does not run on pushes or pull requests.

Configure these repository Actions secrets before using the workflow: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.

For each release:

1. Update `VERSION`.
2. Update the matching `version` in `package.json`.
3. Update `CACHE_VERSION` in `service-worker.js` to the same version.
4. Run `npm test`.
5. Review the release and manually run the **Manual Deploy** workflow.
6. Load the production app once online, then verify core features with the network disabled.
7. Keep the launch smoke-test and rollback procedure in [LAUNCH.md](LAUNCH.md).

## Icon tooling

Run `python generate-icons.py` with Pillow installed to generate the declared PWA PNG icons. The HTML generators in `icons/` provide browser-based alternatives.

## Browser capability notes

- Geolocation is optional and requires explicit user action.
- Device compass support is progressive and may require browser permission.
- Browser notifications are optional.
- The prayer-time engine is a client-side astronomical calculation model; local religious practice may use a different timetable or adjustment policy.

## Release status

The DeenTime roadmap is implemented through the completed Phase 1–12 issues tracked under Epic #3. The repository includes the launch engineering baseline for Issue #22, including release-safe service-worker caching, a public privacy page, and a launch/readiness plan. Real-device production smoke tests and the final public domain decision remain operational launch steps.


---
<!-- Documentation improvement for issue #26 -->
# DeenTime

## Installation

```bash
npm install
```

## Usage

```javascript
const { createClient } = require('./src');
const client = createClient({ apiKey: process.env.API_KEY });
const result = await client.process('input');
console.log(result);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | string | required | Your API authentication key |
| `timeout` | number | 5000 | Request timeout in milliseconds |
| `retries` | number | 3 | Number of automatic retries on failure |

## Contributing

Pull requests are welcome. Please ensure tests pass with `npm test` before submitting.
