const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'script-core.js'), 'utf8');

function runFailure(error, supported = true) {
    let locationText = '';
    let requests = 0;
    const rows = [];
    const elements = {
        locationText: { set textContent(value) { locationText = value; } },
        prayerTimes: { set innerHTML(value) { rows.length = 0; }, appendChild(row) { rows.push(row); } },
        nextPrayerName: { set textContent(value) { this.value = value; } },
        nextPrayerTime: { set textContent(value) { this.value = value; } },
        loading: { style: {} }
    };
    const context = {
        PrayTimes: class { setMethod() {} adjust() {} getTimes() { return { fajr: '05:00', sunrise: '06:00', dhuhr: '12:00', asr: '15:00', maghrib: '18:00', isha: '20:00' }; } },
        navigator: supported ? { geolocation: { getCurrentPosition(success, failure) { requests++; failure(error); } } } : {},
        document: {
            addEventListener() {},
            getElementById(id) { return elements[id] || null; },
            createElement() { return { set innerHTML(value) {}, className: '' }; }
        },
        window: {}, console, setInterval() { return 1; }, clearInterval() {}
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    const originalLocation = vm.runInContext('({...userSettings.location})', context);
    const originalTimeZone = vm.runInContext('userSettings.timeZone', context);
    let calculations = 0;
    const calculatePrayerTimes = context.calculatePrayerTimes;
    context.calculatePrayerTimes = () => { calculations++; calculatePrayerTimes(); };
    context.updateNextPrayer = () => {};
    context.calculateQibla = () => {};
    context.detectLocation();
    assert.deepEqual(vm.runInContext('({...userSettings.location})', context), originalLocation, 'failed detection must preserve saved coordinates');
    assert.equal(vm.runInContext('userSettings.timeZone', context), originalTimeZone, 'failed detection must preserve saved timezone');
    assert.equal(calculations, supported ? 1 : 0, 'failed detection should recalculate prayer times');
    assert.equal(vm.runInContext('Object.keys(currentPrayerTimes).length', context), supported ? 6 : 0, 'failed detection must render all prayer times');
    assert.equal(requests, supported ? 1 : 0, 'location detection should only request permission when explicitly invoked');
    return locationText;
}

assert.match(runFailure({ code: 1 }), /permission denied.*manually/i, 'denial should provide actionable status');
assert.match(runFailure({ code: 3 }), /timed out.*manually/i, 'timeout should provide actionable status');
assert.match(runFailure({ code: 2 }), /unavailable.*manually/i, 'generic failure should provide actionable status');
assert.match(runFailure(null, false), /not supported/i, 'unsupported geolocation should be explained');
