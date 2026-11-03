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

// Reference times (local hours) from the independent adhan-js 4.x library with matching
// angles, Shafi Asr and no rounding. adhan adds +1 min to Dhuhr for some methods, so
// allow 2 minutes of difference.
const TOLERANCE_HOURS = 2 / 60;
const referenceCases = [
    {
        name: 'Mumbai, MWL', method: 'MWL', date: [2026, 9, 12], coords: [19.076, 72.8777], timezone: 5.5,
        expected: { fajr: 5.202, sunrise: 6.425, dhuhr: 12.597, asr: 15.958, maghrib: 18.731, isha: 19.881 }
    },
    {
        name: 'Makkah, Umm al-Qura', method: 'Makkah', date: [2026, 3, 1], coords: [21.4225, 39.8262], timezone: 3,
        expected: { fajr: 5.422, sunrise: 6.691, dhuhr: 12.55, asr: 15.913, maghrib: 18.414, isha: 19.914 }
    },
    {
        name: 'Cairo, Egypt', method: 'Egypt', date: [2026, 6, 21], coords: [30.0444, 31.2357], timezone: 2,
        expected: { fajr: 3.136, sunrise: 4.906, dhuhr: 11.964, asr: 15.54, maghrib: 18.989, isha: 20.549 }
    },
    {
        name: 'New York, ISNA', method: 'ISNA', date: [2026, 1, 15], coords: [40.7128, -74.006], timezone: -5,
        expected: { fajr: 5.959, sunrise: 7.298, dhuhr: 12.108, asr: 14.581, maghrib: 16.89, isha: 18.23 }
    },
    {
        name: 'Sydney, Karachi', method: 'Karachi', date: [2026, 12, 5], coords: [-33.8688, 151.2093], timezone: 11,
        expected: { fajr: 3.914, sunrise: 5.616, dhuhr: 12.776, asr: 16.51, maghrib: 19.907, isha: 21.614 }
    }
];

for (const { name, method, date, coords, timezone, expected } of referenceCases) {
    const calculator = new context.PrayTimes(method);
    calculator.adjust({ asrMethod: 1 });
    const times = calculator.getTimes(date, coords, timezone, 0, 'Float');
    for (const [prayer, expectedHours] of Object.entries(expected)) {
        const difference = Math.abs(times[prayer] - expectedHours);
        assert.ok(
            difference <= TOLERANCE_HOURS,
            `${name} ${prayer}: expected ${expectedHours.toFixed(3)}h, got ${times[prayer]} (off by ${(difference * 60).toFixed(1)} min)`
        );
    }
}

console.log('DeenTime prayer-time regression tests passed.');
