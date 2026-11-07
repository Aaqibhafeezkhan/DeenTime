const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'phase4.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// The next-prayer status must be a polite live region, separate from the per-second timer.
const statusTag = html.match(/<p[^>]*id="nextPrayerStatus"[^>]*>/);
assert.ok(statusTag, 'the next-prayer status live region should exist in index.html');
assert.match(statusTag[0], /role="status"/, 'the next-prayer status should have role="status"');
assert.match(statusTag[0], /aria-live="polite"/, 'the next-prayer status should be aria-live="polite"');

const DAY = Date.UTC(2026, 10, 6);
const at = (h, m, s = 0) => DAY + ((h * 60 + m) * 60 + s) * 1000;
let clock = at(14, 0);

class FakeDate extends Date {
    constructor(...args) {
        if (args.length) super(...args);
        else super(clock);
    }
    static now() { return clock; }
}

function createElement() {
    const element = { writes: 0, _text: '' };
    Object.defineProperty(element, 'textContent', {
        get() { return this._text; },
        set(value) { this._text = String(value); this.writes += 1; }
    });
    return element;
}

const elements = {
    nextPrayerName: createElement(),
    nextPrayerTime: createElement(),
    countdown: createElement(),
    nextPrayerStatus: createElement(),
    prayerTimes: { innerHTML: '', appendChild() {} }
};

const times = { fajr: '05:00', sunrise: '06:30', dhuhr: '12:00', asr: '15:00', maghrib: '18:00', isha: '19:30' };

const context = {
    Date: FakeDate,
    setInterval() { return 1; },
    prayerNames: {
        fajr: { name: 'Fajr' }, sunrise: { name: 'Sunrise' }, dhuhr: { name: 'Dhuhr' },
        asr: { name: 'Asr' }, maghrib: { name: 'Maghrib' }, isha: { name: 'Isha' }
    },
    userSettings: { timeZone: 'UTC' },
    getPrayerTimesForDate: () => times,
    parseTime: value => value.split(':').map(Number),
    getTimeZoneDateParts: date => ({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }),
    zonedTimeToDate: (y, m, d, h, min) => new Date(Date.UTC(y, m - 1, d, h, min)),
    addDaysInTimeZone: (date, n) => new Date(date.getTime() + n * 86400000),
    document: { getElementById: id => elements[id] || null }
};
vm.createContext(context);
vm.runInContext(source, context);
const run = code => vm.runInContext(code, context);
// The prayer list rendering is not under test here; keep it out of the DOM stub.
run('renderPrayerTimes = () => {};');

// First render (page load) should not announce anything.
run('updateNextPrayer();');
assert.equal(elements.nextPrayerName.textContent, 'Asr', 'the first render should show Asr');
assert.equal(elements.nextPrayerStatus.textContent, '', 'the first render should not announce a prayer change');

// Crossing Asr should announce the new next prayer once.
clock = at(15, 0, 1);
run('updateNextPrayer();');
assert.equal(elements.nextPrayerStatus.textContent, 'Next prayer: Maghrib at 18:00', 'the prayer change should be announced as the next prayer');

// Per-second countdown ticks must not write to the live region.
const writesBefore = elements.nextPrayerStatus.writes;
for (let s = 2; s <= 30; s += 1) {
    clock = at(15, 0, s);
    run('phase4UpdateCountdown();');
}
assert.equal(elements.nextPrayerStatus.writes, writesBefore, 'countdown ticks should not announce anything');
assert.equal(elements.countdown.textContent, '02:59:30', 'the visible countdown should keep updating every second');
