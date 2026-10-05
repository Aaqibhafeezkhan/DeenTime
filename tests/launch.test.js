const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const index = read('index.html');
const manifest = JSON.parse(read('manifest.json'));
const serviceWorker = read('service-worker.js');
const vercel = JSON.parse(read('vercel.json'));
const privacy = read('privacy.html');
const launch = read('LAUNCH.md');
const packageJson = JSON.parse(read('package.json'));
const version = read('VERSION').trim();

assert(index.includes('href="privacy.html"'), 'Index must expose the privacy page');
assert.strictEqual(manifest.id, './', 'Manifest must define a stable app id');
assert.deepStrictEqual(manifest.categories, ['lifestyle', 'utilities'], 'Manifest categories must be launch metadata');
assert(serviceWorker.includes("'privacy.html'"), 'Privacy page must be precached');
assert(serviceWorker.includes('deentime-v1.0.1'), 'Service-worker cache version must match the launch release');
assert(vercel.headers.some(entry => entry.source === '/service-worker.js'), 'Vercel must define service-worker caching');
assert(vercel.headers.some(entry =>
    entry.source === '/index.html' &&
    entry.headers.some(header => header.key === 'Cache-Control' && header.value.includes('no-store'))
), 'Index must be explicitly non-cacheable at the host layer');
assert(vercel.headers.some(entry =>
    entry.source === '/(.*)' &&
    entry.headers.some(header => header.key === 'X-Content-Type-Options' && header.value === 'nosniff')
), 'Security headers must be defined');
assert(privacy.includes('local-first'), 'Privacy page must explain the local-first model');
assert(launch.includes('Production hosting target: **Vercel**'), 'Launch plan must document the hosting decision');
assert(!index.includes('Azaan Pro'), 'Legacy branding must not return');
assert(!index.includes('document.write'), 'Legacy document loader must not return');
assert(!packageJson.scripts.test.includes('.github/workflows'), 'No GitHub Actions dependency belongs in the test script');
assert.strictEqual(packageJson.version, version, 'Package and VERSION releases must stay aligned');

console.log('Launch-readiness tests passed.');
