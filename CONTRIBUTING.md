# Contributing to DeenTime

Thank you for considering a contribution to DeenTime. The project is a framework-free, local-first Islamic worship PWA, so changes should preserve its privacy-first behavior and keep the application simple to run and maintain.

## Find a task

- Browse [open issues](https://github.com/Aaqibhafeezkhan/DeenTime/issues).
- Issues labeled `good first issue` or `up-for-grabs` are intended as approachable starting points.
- Before starting, leave a short comment on the issue describing the approach you plan to take. Work on one issue at a time so tasks remain available to other contributors.
- If the issue is unclear, ask a question before implementing a broad solution.

## Run locally

Use a current Node.js release and Python 3.

~~~sh
python -m http.server 8000
~~~

Open http://localhost:8000 in a browser. Some browser APIs, including service workers, require HTTP or HTTPS rather than opening the HTML file directly.

## Run the tests

~~~sh
npm test
~~~

The test suite is deterministic and does not require real geolocation, device sensors, notification permission, or external APIs.

## Pull request guidelines

1. Keep each PR focused on one issue or one clearly scoped improvement.
2. Make the smallest change that solves the problem.
3. Add or update deterministic tests when behavior changes.
4. Preserve the local-first privacy model; do not introduce accounts, analytics, external geocoding, or backend services without an approved issue.
5. Production deployment is manual; the deploy workflow must not run automatically on pushes or pull requests.
6. Include a concise summary and a self-review note in the PR description.
7. Run `npm test` before opening the PR and describe the result accurately.

## Release and deployment

Production deployment uses a manually triggered GitHub Actions workflow and Vercel. Contributors should not deploy to production as part of an ordinary PR.

A maintainer can run **Actions → Manual Deploy → Run workflow** after reviewing the release version. Configure the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repository secrets first. The workflow runs the test suite before deploying. Follow [LAUNCH.md](LAUNCH.md) for version alignment, production smoke tests, and rollback.

## Project boundaries

- Keep DeenTime framework-free unless an issue explicitly approves a change.
- Keep settings and worship utility state on the device.
- Treat prayer-time calculations as a useful calculation model, not a replacement for a user's trusted local timetable.
- Avoid unrelated refactors, dependencies, and broad feature additions in focused bug-fix PRs.
