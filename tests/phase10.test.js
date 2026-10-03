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
assert.match(css, /:focus-visible/u);
assert.match(css, /prefers-reduced-motion/u);

console.log('Phase 10 accessibility and responsive UX tests passed');
