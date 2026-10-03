const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('script-core.js', 'utf8');

assert.match(source, /function safeStorageGet/u);
assert.match(source, /function safeStorageSet/u);
assert.match(source, /function normalizeSettings/u);
assert.match(source, /function resetSettings/u);
assert.match(source, /navigator\.geolocation\.getCurrentPosition/u);
assert.equal(source.includes('bigdatacloud.net'), false);

const initMatch = source.match(/function initApp\(\) \{([\s\S]*?)\n\}/u);
assert.ok(initMatch);
assert.equal(/detectLocation\(\)/u.test(initMatch[1]), false);

console.log('Phase 11 privacy and local-first tests passed');
