const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('style.css', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const testing = fs.readFileSync('TESTING.md', 'utf8');

// The global reduced-motion rule must cover every animation and transition.
const reduceBlock = css.match(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/u);
assert.ok(reduceBlock, 'style.css should define a prefers-reduced-motion: reduce block');
assert.match(reduceBlock[1], /\*,\s*\*::before,\s*\*::after/u, 'reduced-motion rule should cover all elements');
assert.match(reduceBlock[1], /animation-duration:\s*0\.001ms\s*!important/u, 'reduced-motion rule should shorten animations');
assert.match(reduceBlock[1], /animation-iteration-count:\s*1\s*!important/u, 'reduced-motion rule should stop looping animations after one cycle');
assert.match(reduceBlock[1], /transition-duration:\s*0\.001ms\s*!important/u, 'reduced-motion rule should shorten transitions');

// The loading ring uses an infinite spin animation that the global rule must override.
assert.match(html, /animate-spin/u, 'loading ring should use the spin animation');

// The loading indicator text that the manual check relies on must still exist.
assert.match(html, /Loading prayer times\.\.\./u, 'loading text should remain in index.html');

// The manual verification step must be documented in TESTING.md.
const bullet = testing.split('\n').find((line) => /OS reduced-motion setting/u.test(line));
assert.ok(bullet, 'TESTING.md should document the reduced-motion manual check');
assert.match(bullet, /Loading prayer times\.\.\./u, 'manual check should name the loading text');
assert.match(bullet, /ring/u, 'manual check should describe the loading ring');
assert.match(bullet, /countdown/u, 'manual check should cover the countdown');

console.log('Reduced-motion tests passed');
