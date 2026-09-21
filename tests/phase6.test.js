const assert = require('node:assert/strict');

function islamicYearStart(year) {
    return Math.floor((354 * (year - 1)) + Math.floor((3 + 11 * year) / 30));
}

function islamicToJulianDay(year, month, day) {
    return day
        + Math.ceil(29.5 * (month - 1))
        + (year - 1) * 354
        + Math.floor((3 + 11 * year) / 30)
        + 1948439.5 - 1;
}

function gregorianDateToJulianDay(year, month, day) {
    let adjustedYear = year;
    let adjustedMonth = month;
    if (adjustedMonth <= 2) {
        adjustedYear -= 1;
        adjustedMonth += 12;
    }
    const century = Math.floor(adjustedYear / 100);
    const correction = 2 - century + Math.floor(century / 4);
    return Math.floor(365.25 * (adjustedYear + 4716))
        + Math.floor(30.6001 * (adjustedMonth + 1))
        + day + correction - 1524.5;
}

function convert(year, month, day) {
    const jd = Math.floor(gregorianDateToJulianDay(year, month, day)) + 0.5;
    const islamicEpoch = 1948439.5;
    const daysSinceEpoch = jd - islamicEpoch;
    const hijriYear = Math.floor((30 * daysSinceEpoch + 10646) / 10631);
    const hijriMonth = Math.min(12, Math.ceil((daysSinceEpoch - (29 + islamicYearStart(hijriYear))) / 29.5) + 1);
    const hijriDay = Math.floor(jd - islamicToJulianDay(hijriYear, hijriMonth, 1)) + 1;
    return { year: hijriYear, month: hijriMonth, day: hijriDay };
}

assert.deepEqual(convert(2024, 1, 1), { year: 1445, month: 6, day: 19 });
assert.deepEqual(convert(2024, 12, 31), { year: 1446, month: 6, day: 29 });
assert.deepEqual(convert(2025, 1, 1), { year: 1446, month: 7, day: 1 });

for (const date of [
    [2024, 2, 29],
    [2024, 12, 31],
    [2025, 1, 1],
    [2025, 3, 30]
]) {
    const result = convert(...date);
    assert.ok(result.day >= 1 && result.day <= 30);
    assert.ok(result.month >= 1 && result.month <= 12);
    assert.ok(result.year > 1400);
}

console.log('Phase 6 Hijri conversion tests passed');
