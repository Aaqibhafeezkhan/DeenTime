# DeenTime Launch Plan

## Engineering launch decision

DeenTime remains a framework-free static PWA with no backend, accounts, or analytics.

Production hosting target: **GitHub Pages**, using a GitHub Actions workflow that runs on pushes to `main` and supports manual dispatch. The app is published as static files directly from the repository; no build step or deployment credentials are needed.

The production URL is the GitHub Pages URL configured for this repository. A custom DeenTime domain can be added after availability and naming are confirmed.

## Privacy and analytics decision

Launch analytics: **none**.

DeenTime does not add product analytics, advertising identifiers, account tracking, or a telemetry SDK. Settings, coordinates, timezone, calculation preferences, theme, and Tasbih state remain in browser storage.

The browser still makes normal network requests to the production host and to the third-party CDN resources currently referenced by the application. Those providers may receive normal request metadata under their own policies.

## Production deployment

The **Deploy to GitHub Pages** workflow deploys automatically when a change is pushed or merged into `main`. To deploy manually, open **Actions → Deploy to GitHub Pages → Run workflow**. The workflow publishes the static site directly and does not install npm packages, build the app, or run `npm test`. Run `npm test` locally when validating changes before a release.

For each release:

1. Update `VERSION`.
2. Update `version` in `package.json`.
3. Update `CACHE_VERSION` in `service-worker.js` to the same version.
4. Run `npm test` locally.
5. Review the release, then merge it into `main` or manually run **Deploy to GitHub Pages**.
6. Validate the production URL online before sharing it publicly.
7. Exercise the offline flow after the site has been loaded successfully once.
8. Record the production deployment URL and release version.

## Production smoke test

Validate these on at least one current desktop browser and one current Android/iOS browser before public launch:

- Prayer times render correctly for the selected coordinates and timezone.
- Next prayer and countdown transition correctly across Isha → next-day Fajr.
- Manual coordinates/timezone persist locally and reset correctly.
- Geolocation is requested only after the user taps **Detect My Location**.
- Qibla remains usable without device compass, and compass permission is opt-in.
- Hijri date and calendar render.
- Tasbih state persists locally.
- 99 Names search and detail dialog work.
- The privacy page is reachable.
- PWA install prompt/installation works where the browser supports it.
- App shell loads after the first successful online visit with the network disabled.
- A release with a new service-worker cache version is detected and the update notice is shown.
- No unexpected console errors or broken asset requests appear in production.

## Rollback

Revert the deployment-causing change and merge the revert into `main`; GitHub Actions will publish the reverted static files. Re-run the production smoke test before sharing the URL again.

## Initial positioning

**Primary audience:** people who want a simple, installable prayer-time companion without creating an account.

**Positioning:** DeenTime is a local-first Islamic prayer and worship companion focused on prayer times, Qibla, Hijri calendar, Tasbih, and the 99 Names of Allah.

Launch message:

> A simple, installable Islamic prayer companion that keeps your settings and location on your device.

Avoid positioning the app as a scholarly authority or claiming that its calculated prayer times supersede a local mosque or trusted timetable.

## GTM sequence

### Soft launch

Start with a small group of people who can realistically test prayer, location, PWA, and offline behavior. Ask for concrete bug reports and usability feedback rather than broad feature requests.

### Public launch

Use channels where the app is contextually relevant and self-promotion is allowed:

- Personal LinkedIn post.
- Relevant Reddit communities, following each community's posting rules.
- Direct sharing with friends/family who are likely to use the core features.

Launch with a short demo, two or three screenshots, the production URL, and one clear value proposition.

### Initial success metrics

Keep measurement lightweight and privacy-preserving:

- 10+ real testers during soft launch.
- 5+ useful pieces of qualitative feedback.
- Zero known P0/P1 production defects at public launch.
- Successful PWA installation on at least two supported devices.
- No critical offline or service-worker regression.
- GitHub issues or direct feedback used to rank the first post-launch improvements.

These are launch/feedback metrics, not hidden behavioral tracking.

## Post-launch priorities

Prioritize fixes that improve correctness, trust, privacy, installation, accessibility, and daily usefulness.

Defer large backend, account, social, monetization, and infrastructure work until real usage demonstrates a concrete need.
