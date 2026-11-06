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
const monthButtons = [...html.matchAll(/<button\b([^>]*\bonclick="changeMonth\(-?1\)"[^>]*)>([\s\S]*?)<\/button>/gu)];
assert.equal(monthButtons.length, 2, 'calendar should have previous and next month buttons');
assert.deepEqual(monthButtons.map(([, attributes]) => attributes.match(/\baria-label="([^"]+)"/u)?.[1]), ['Previous month', 'Next month'], 'each month button needs a distinct accessible name');
for (const [, attributes, content] of monthButtons) {
    assert.match(attributes, /\btype="button"/u, 'month buttons should be plain buttons');
    assert.match(attributes, /\baria-controls="calendarGrid"/u, 'month buttons should reference the grid they change');
    assert.match(content, /<i\b[^>]*\baria-hidden="true"[^>]*>/u, 'chevron icons should be decorative');
}
assert.match(html, /<h3 id="calendarMonth"[^>]*\baria-live="polite"/u, 'the new month should be announced after navigation');
assert.match(css, /:focus-visible/u);
assert.match(css, /prefers-reduced-motion/u);

console.log('Phase 10 accessibility and responsive UX tests passed');
