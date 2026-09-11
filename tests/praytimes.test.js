const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'praytimes.js'), 'utf8');
const context = { Math };
vm.runInNewContext(`${source}\nthis.PrayTimes = PrayTimes;`, context);

function calculate(method, asrMethod, format = 'Float') {
    const calculator = new context.PrayTimes(method);
    calculator.adjust({ asrMethod });
    return calculator.getTimes([2026, 9, 12], [19.076, 72.8777], 5.5, 0, format);
}

function assertFiniteTimes(times) {
    for (const [name, value] of Object.entries(times)) {
        assert.equal(typeof value, 'number', `${name} should be numeric`);
        assert.ok(Number.isFinite(value), `${name} should be finite`);
        assert.ok(value >= 0 && value < 24, `${name} should be within a day`);
    }
}

const standard = calculate('MWL', 1);
const hanafi = calculate('MWL', 2);

assertFiniteTimes(standard);
assertFiniteTimes(hanafi);
assert.notEqual(standard.asr, hanafi.asr, 'Standard and Hanafi Asr must differ');
assert.ok(hanafi.asr > standard.asr, 'Hanafi Asr should occur later for the same inputs');

const twelveHour = calculate('MWL', 1, '12h');
for (const [name, value] of Object.entries(twelveHour)) {
    assert.match(value, /^\d{2}:\d{2} (AM|PM)$/, `${name} should use 12-hour formatting`);
}

const methods = ['MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari'];
for (const method of methods) {
    const times = calculate(method, 1);
    assertFiniteTimes(times);
}

console.log('DeenTime prayer-time regression tests passed.');
