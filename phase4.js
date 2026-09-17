const phase4PrayerOrder = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
let phase4CountdownInterval = null;
let phase4NextPrayerKey = null;
let phase4NextPrayerAt = null;

function phase4PrayerTimesForDate(date) {
    return prayerTimesCalc.getTimes(
        [date.getFullYear(), date.getMonth() + 1, date.getDate()],
        [userSettings.location.lat, userSettings.location.lng],
        date.getTimezoneOffset() / -60,
        0,
        userSettings.timeFormat
    );
}

function phase4PrayerDate(key, date) {
    const times = phase4PrayerTimesForDate(date);
    const [hours, minutes] = parseTime(times[key]);
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

function phase4FindNextPrayer(now) {
    const todayTimes = phase4PrayerTimesForDate(now);

    for (const key of phase4PrayerOrder) {
        const target = phase4PrayerDate(key, now);
        if (target.getTime() > now.getTime()) {
            return { key, time: todayTimes[key], target };
        }
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowTimes = phase4PrayerTimesForDate(tomorrow);
    return {
        key: 'fajr',
        time: tomorrowTimes.fajr,
        target: phase4PrayerDate('fajr', tomorrow)
    };
}

function phase4FormatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function phase4UpdateCountdown() {
    if (!phase4NextPrayerAt) return;

    const remaining = phase4NextPrayerAt.getTime() - Date.now();
    if (remaining <= 0) {
        updateNextPrayer();
        return;
    }

    document.getElementById('countdown').textContent = phase4FormatCountdown(remaining);
}

function updateNextPrayer() {
    const now = new Date();
    const next = phase4FindNextPrayer(now);
    const prayerChanged = phase4NextPrayerKey !== next.key || !phase4NextPrayerAt || phase4NextPrayerAt.getTime() !== next.target.getTime();

    phase4NextPrayerKey = next.key;
    phase4NextPrayerAt = next.target;

    document.getElementById('nextPrayerName').textContent = prayerNames[next.key].name;
    document.getElementById('nextPrayerTime').textContent = next.time;
    phase4UpdateCountdown();

    if (prayerChanged && typeof renderPrayerTimes === 'function') {
        renderPrayerTimes();
    }

    if (!phase4CountdownInterval) {
        phase4CountdownInterval = setInterval(phase4UpdateCountdown, 1000);
    }
}

function renderPrayerTimes() {
    const container = document.getElementById('prayerTimes');
    container.innerHTML = '';
    const now = new Date();
    const next = phase4FindNextPrayer(now);
    const todayTimes = phase4PrayerTimesForDate(now);

    phase4PrayerOrder.forEach((key) => {
        const time = todayTimes[key];
        const info = prayerNames[key];
        const target = phase4PrayerDate(key, now);
        const isNext = key === next.key && target.getTime() === next.target.getTime();
        const isPast = target.getTime() <= now.getTime() && !isNext;

        const row = document.createElement('div');
        row.className = `flex items-center justify-between p-4 ${isNext ? 'bg-teal-50 dark:bg-teal-900/30' : ''} ${isPast ? 'opacity-60' : ''}`;
        row.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-white">
                    <i class="fas ${info.icon}"></i>
                </div>
                <div>
                    <p class="font-semibold text-gray-800 dark:text-white">${info.name}</p>
                    ${isNext ? '<span class="text-xs text-teal-600 font-medium">Next prayer</span>' : ''}
                </div>
            </div>
            <span class="text-xl font-bold text-gray-800 dark:text-white">${time}</span>
        `;
        container.appendChild(row);
    });
}
