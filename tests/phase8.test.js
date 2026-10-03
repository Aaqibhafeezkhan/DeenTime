const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('names-of-allah.js', 'utf8');
const context = {};
vm.runInNewContext(source + '\nthis.namesOfAllah = namesOfAllah;', context);

assert.equal(context.namesOfAllah.length, 99);
assert.deepEqual(
    context.namesOfAllah.map(name => name.number),
    Array.from({ length: 99 }, (_, index) => index + 1)
);
assert.equal(new Set(context.namesOfAllah.map(name => name.ar)).size, 99);

for (const name of context.namesOfAllah) {
    assert.ok(name.ar);
    assert.ok(name.en);
    assert.ok(name.meaning);
}

console.log('Phase 8 Names of Allah tests passed');
