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

Run the deterministic test suite locally:

~~~sh
npm test
~~~

The tests avoid live geolocation, device sensors, external APIs, and browser notification services.

For the manual testing checklist, see [TESTING.md](TESTING.md).

## Verifying prayer-time calculations

Use this checklist when comparing DeenTime's calculated prayer times against a trusted timetable. The comparison is meaningful only when both sources use matching inputs and settings.

### Before comparing

Record the following settings in DeenTime and in the reference timetable:

- **Date:** Use the same Gregorian calendar date in both sources.
- **Coordinates:** Use the same latitude and longitude. Do not compare results from different locations, even if the displayed place names are similar.
- **Timezone:** Use the same IANA timezone, such as `Asia/Riyadh`. Confirm that both sources display times in the same local timezone.
- **Calculation method:** Select the same calculation method in DeenTime and the reference source. If the reference source does not identify its method, note that limitation.
- **Asr setting:** Match the Asr calculation setting. In particular, distinguish Standard from Hanafi where the sources offer these options.
- **Adjustments:** Check whether either source applies manual minute adjustments, high-latitude rules, or other local timetable policies. Record any differences rather than assuming the settings are equivalent.

### Repeatable comparison checklist

1. Choose a date and a specific location with known coordinates.
2. Open DeenTime and enter or confirm those coordinates and the corresponding IANA timezone.
3. Select the calculation method and Asr setting used by the reference timetable.
4. Obtain the reference prayer times for the exact same date and location from a trusted timetable or calculation source.
5. Record the displayed times for Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha wherever the reference provides them.
6. Compare each corresponding time using the same local clock format. If a time differs, record the prayer, DeenTime value, reference value, and difference in minutes.
7. Recheck the date, coordinates, timezone, calculation method, Asr setting, and any documented adjustments before treating a difference as a calculation defect.
8. Repeat the comparison for another date or location if you need to investigate whether the difference is consistent.

### Recording results

Use a simple table when reporting a discrepancy:

| Field | Value |
| --- | --- |
| Date | YYYY-MM-DD |
| Latitude / longitude | Coordinates used by both sources |
| IANA timezone | Timezone used by both sources |
| DeenTime calculation method | Selected method |
| Reference source and method | Source name and method, if known |
| Asr setting | Standard or Hanafi, as applicable |
| Prayer and observed difference | Prayer name and difference in minutes |
| Adjustments or other notes | Known settings or differences |

Include the actual values from both sources in a bug report when possible. This makes the result reproducible and helps distinguish a configuration mismatch from a possible calculation issue.

### Interpreting differences

A difference does not automatically mean that DeenTime is incorrect. Trusted timetables, local mosques, and calculation services may use different calculation methods, manual adjustments, rounding conventions, high-latitude policies, or local religious guidance.

If the settings match and a discrepancy remains, document the evidence and investigate the calculation before proposing a code change. Do not assume that one source is authoritative solely because its result differs.

**DeenTime does not replace a local mosque's timetable or guidance from a trusted religious authority.** Use the timetable and practices appropriate to your community.

## Contributing

DeenTime welcomes focused improvements to correctness, accessibility, privacy, documentation, and usability. Start with the [contributor guide](CONTRIBUTING.md) and browse [open issues](https://github.com/Aaqibhafeezkhan/DeenTime/issues).

## PWA and offline behavior

The service worker precaches the application shell and local icon assets. Navigation uses network-first behavior with a cached application-shell fallback. Local static assets use cache-first behavior with network refresh. External optional resources use network-first behavior with a runtime-cache fallback.

The service-worker cache is versioned using `CACHE_VERSION`. Updating the version during a release removes stale DeenTime caches and lets the application show a non-blocking update notice.

## Deployment and release

DeenTime is a static site hosted on GitHub Pages. The **Deploy to GitHub Pages** workflow runs automatically when changes reach `main` and can also be started from **Actions → Deploy to GitHub Pages → Run workflow**. It publishes the repository's static files directly, without an npm install, build, or test step. No deployment secrets are required.

For each release:

1. Update `VERSION`.
2. Update the matching `version` in `package.json`.
3. Update `CACHE_VERSION` in `service-worker.js` to the same version.
4. Run `npm test` locally when validating changes.
5. Merge the reviewed change into `main` or manually run the deployment workflow.
6. Load the production app once online, then verify core features with the network disabled.
7. Keep the launch smoke-test procedure in [LAUNCH.md](LAUNCH.md).

## Icon tooling

Run `python generate-icons.py` with Pillow installed to generate the declared PWA PNG icons. The HTML generators in `icons/` provide browser-based alternatives.

## Browser capability notes

- Geolocation is optional and requires explicit user action.
- Device compass support is progressive and may require browser permission.
- Browser notifications are optional.
- The prayer-time engine is a client-side astronomical calculation model; local religious practice may use a different timetable or adjustment policy.

## Release status

The DeenTime roadmap is implemented through the completed Phase 1–12 issues tracked under Epic #3. The repository includes the launch engineering baseline for Issue #22, including release-safe service-worker caching, a public privacy page, and a launch/readiness plan. Real-device production smoke tests and the final public domain decision remain operational launch steps.
