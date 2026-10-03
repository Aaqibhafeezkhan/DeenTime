const assert = require('node:assert/strict');
const fs = require('node:fs');

const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
assert.equal(manifest.short_name, 'DeenTime');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');

for (const icon of manifest.icons) {
    assert.equal(fs.existsSync(icon.src), true, `Missing PWA icon: ${icon.src}`);
}

const serviceWorker = fs.readFileSync('service-worker.js', 'utf8');
for (const asset of [
    'index.html',
    'style.css',
    'praytimes.js',
    'names-of-allah.js',
    'script-core.js',
    'phase4.js',
    'phase5.js',
    'phase6.js',
    'phase7.js'
]) {
    assert.ok(serviceWorker.includes(asset), `Service worker should reference ${asset}`);
}

assert.match(serviceWorker, /CACHE_VERSION\s*=\s*['"]deentime-v1\.0\.0['"]/u);
assert.match(serviceWorker, /event\.respondWith/u);
assert.match(serviceWorker, /index\.html/u);

console.log('Phase 9 PWA and service-worker tests passed');
