const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

assert.equal(/user-scalable\s*=\s*no/i.test(html), false);
assert.equal(/maximum-scale\s*=\s*1/i.test(html), false);
assert.match(html, /aria-label="Toggle dark mode"/u);
assert.match(html, /aria-label="Enable device compass"/u);
assert.match(html, /id="namesSearch"/u);
assert.match(html, /<nav aria-label="Primary navigation"/u);
const locationDisplay = html.match(/<div\b([^>]*\bid="locationDisplay"[^>]*)>([\s\S]*?)<\/div>/u);
assert.ok(locationDisplay, 'location display should remain in the header');
assert.match(locationDisplay[1], /\brole="group"/u, 'location should be a semantic group');
assert.match(locationDisplay[1], /\baria-label="Current prayer location"/u, 'location group should have a useful name');
assert.doesNotMatch(locationDisplay[1], /\baria-hidden="true"/u);
assert.match(locationDisplay[2], /<i\b[^>]*\bfa-map-marker-alt\b[^>]*\baria-hidden="true"[^>]*>/u, 'map pin should be decorative');
assert.match(locationDisplay[2], /<span id="locationText">Detecting location\.\.\.<\/span>/u, 'location text should stay exposed for city and coordinate updates');
assert.match(css, /:focus-visible/u);
assert.match(css, /prefers-reduced-motion/u);

console.log('Phase 10 accessibility and responsive UX tests passed');
