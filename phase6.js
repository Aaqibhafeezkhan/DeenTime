const hijriMonthNames = [
    'Muharram',
    'Safar',
    'Rabi al-Awwal',
    'Rabi al-Thani',
    'Jumada al-Awwal',
    'Jumada al-Thani',
    'Rajab',
    'Shaban',
    'Ramadan',
    'Shawwal',
    'Dhu al-Qadah',
    'Dhu al-Hijjah'
];

const gregorianMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

function getGregorianDateParts(date) {
    return getTimeZoneDateParts(date);
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

function julianDayToHijri(julianDay) {
    const jd = Math.floor(julianDay) + 0.5;
    const islamicEpoch = 1948439.5;
    const daysSinceEpoch = jd - islamicEpoch;
    const year = Math.floor((30 * daysSinceEpoch + 10646) / 10631);
    const month = Math.min(12, Math.ceil((daysSinceEpoch - (29 + islamicYearStart(year))) / 29.5) + 1);
    const day = Math.floor(jd - islamicToJulianDay(year, month, 1)) + 1;

    return {
        day,
        month,
        monthName: hijriMonthNames[month - 1],
        year
    };
}

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

function gregorianToHijri(date) {
    const parts = getGregorianDateParts(date);
    return julianDayToHijri(
        gregorianDateToJulianDay(parts.year, parts.month, parts.day)
    );
}

function formatHijriDate(hijri) {
    return `${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
}

function formatGregorianDate(date) {
    return new Intl.DateTimeFormat('en-US', { timeZone: userSettings.timeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

function updateCurrentTime() {
    const now = new Date();
    const timeStr = new Intl.DateTimeFormat('en-US', {
        timeZone: userSettings.timeZone,
        hour12: userSettings.timeFormat !== '24h',
        hour: '2-digit',
        minute: '2-digit'
    }).format(now);
    const currentTime = document.getElementById('currentTime');
    const currentDate = document.getElementById('currentDate');
    const hijriDate = document.getElementById('hijriDate');
    const formattedHijri = formatHijriDate(gregorianToHijri(now));
    if (currentTime) currentTime.textContent = timeStr;
    if (currentDate) currentDate.textContent = formatGregorianDate(now);
    if (hijriDate) {
        hijriDate.textContent = formattedHijri;
        hijriDate.setAttribute('aria-label', `Hijri date: ${formattedHijri}`);
    }
}

function renderCalendar() {
    const now = new Date();
    const nowParts = getTimeZoneDateParts(now);
    const anchor = new Date(Date.UTC(nowParts.year, nowParts.month - 1, 1, 12, 0, 0));
    anchor.setUTCMonth(anchor.getUTCMonth() + calendarOffset);
    const month = anchor.getUTCMonth();
    const year = anchor.getUTCFullYear();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const startingDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const firstDay = zonedTimeToDate(year, month + 1, 1, 12, 0, userSettings.timeZone);
    const lastDay = zonedTimeToDate(year, month + 1, daysInMonth, 12, 0, userSettings.timeZone);
    const firstHijri = gregorianToHijri(firstDay);
    const lastHijri = gregorianToHijri(lastDay);
    const heading = document.getElementById('calendarMonth');
    if (heading) heading.textContent = `${gregorianMonthNames[month]} ${year} · ${firstHijri.monthName} ${firstHijri.year} AH`;
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(dayName => {
        const cell = document.createElement('div');
        cell.className = 'text-xs font-bold text-gray-400 p-2';
        cell.textContent = dayName;
        cell.setAttribute('aria-hidden', 'true');
        grid.appendChild(cell);
    });
    for (let i = 0; i < startingDay; i++) grid.appendChild(document.createElement('div'));
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = zonedTimeToDate(year, month + 1, day, 12, 0, userSettings.timeZone);
        const hijri = gregorianToHijri(cellDate);
        const isToday = year === nowParts.year && month + 1 === nowParts.month && day === nowParts.day;
        const cell = document.createElement('div');
        cell.className = `calendar-day p-2 rounded-lg ${isToday ? 'bg-teal-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`;
        cell.setAttribute('aria-label', `${formatGregorianDate(cellDate)}, ${formatHijriDate(hijri)}`);
        cell.innerHTML = `<div class="font-bold">${day}</div><div class="text-xs opacity-70">${hijri.day} ${hijri.monthName}</div>`;
        grid.appendChild(cell);
    }
    if (firstHijri.month !== lastHijri.month && heading) heading.textContent = `${gregorianMonthNames[month]} ${year} · ${firstHijri.monthName}–${lastHijri.monthName} ${lastHijri.year} AH`;
}

function changeMonth(delta) {
    calendarOffset += delta;
    renderCalendar();
}
