const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// script-core.js is browser code, so load the real file in a VM with stubs for
// the two globals it touches at load time (PrayTimes and document). The helpers
// under test are the shipped ones, not copies.
//
// Fallback contract for a saved timezone (#28): normalizeSettings() validates
// the stored value with isValidTimeZone(); anything that is not a supported IANA
// identifier — empty, whitespace, a non-string, or an unknown zone — falls back
// to the default 'Asia/Riyadh', so the app initializes and formats dates
// instead of throwing.
const source = fs.readFileSync(path.join(__dirname, '..', 'script-core.js'), 'utf8');
const context = {
    PrayTimes: class {
        setMethod() {}
        adjust() {}
        getTimes() {
            return {};
        }
    },
    document: {
        addEventListener() {},
        getElementById() {
            return null;
        }
    },
    window: {},
    console
};
vm.createContext(context);
vm.runInContext(source, context, { filename: 'script-core.js' });

const { isValidTimeZone, normalizeSettings, getTimeZoneDateParts, zonedTimeToDate } = context;
const DEFAULT_ZONE = 'Asia/Riyadh';

// Supported IANA identifiers stay accepted.
for (const zone of ['UTC', 'Asia/Riyadh', 'Asia/Kolkata', 'America/New_York', 'Europe/London']) {
    assert.equal(isValidTimeZone(zone), true, `${zone} should be accepted`);
}

// Empty, whitespace-only and non-string values are rejected instead of being
// passed to Intl.
for (const value of ['', ' ', '\t\n', null, undefined, 42, {}, []]) {
    assert.equal(isValidTimeZone(value), false, `${JSON.stringify(value)} should be rejected`);
}

// Unknown identifiers are rejected.
for (const zone of ['Not/AZone', 'Mars/Phobos', 'Asia/Nowhere', 'UTC+99']) {
    assert.equal(isValidTimeZone(zone), false, `${zone} should be rejected`);
}

// A saved invalid timezone falls back to the default instead of crashing the
// settings load.
for (const saved of ['Not/AZone', 'Mars/Phobos', '', '   ', null, undefined, 42]) {
    assert.equal(normalizeSettings({ timeZone: saved }).timeZone, DEFAULT_ZONE);
}
assert.equal(normalizeSettings({}).timeZone, DEFAULT_ZONE, 'a missing timezone falls back');
assert.equal(normalizeSettings(null).timeZone, DEFAULT_ZONE, 'no saved settings falls back');

// Valid saved values survive normalization.
assert.equal(normalizeSettings({ timeZone: 'Asia/Kolkata' }).timeZone, 'Asia/Kolkata');
assert.equal(normalizeSettings({ timeZone: 'UTC' }).timeZone, 'UTC');

// App initialization / date formatting must not throw with the sanitized value.
const sanitized = normalizeSettings({ timeZone: 'Not/AZone' }).timeZone;
const parts = getTimeZoneDateParts(new Date('2026-10-28T00:00:00Z'), sanitized);
// The object comes from the VM realm, so compare fields instead of prototypes.
assert.equal(parts.year, 2026);
assert.equal(parts.month, 10);
assert.equal(parts.day, 28);
const noon = zonedTimeToDate(parts.year, parts.month, parts.day, 12, 0, sanitized);
assert.equal(Number.isNaN(noon.getTime()), false, 'zoned time conversion should produce a date');
assert.equal(
    new Intl.DateTimeFormat('en-US', { timeZone: sanitized }).format(new Date()),
    new Intl.DateTimeFormat('en-US', { timeZone: DEFAULT_ZONE }).format(new Date())
);

console.log('Timezone validation tests passed');
