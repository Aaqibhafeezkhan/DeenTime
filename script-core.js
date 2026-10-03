const userSettings = {
    location: { lat: 21.4225, lng: 39.8262 },
    calcMethod: 'MWL',
    madhab: 'Standard',
    notifications: false,
    timeFormat: '24h',
    theme: 'auto',
    tasbihTarget: 33,
    currentDhikr: 'SubhanAllah',
    locationName: 'Makkah, Saudi Arabia',
    timeZone: 'Asia/Riyadh'
};

let prayerTimesCalc = new PrayTimes('MWL');
let currentPrayerTimes = {};
let nextPrayerTimeout = null;
let countdownInterval = null;
let calendarOffset = 0;
let tasbihCount = 0;
let qiblaAngle = 0;

const prayerNames = {
    fajr: { name: 'Fajr', icon: 'fa-cloud-sun', color: 'from-blue-400 to-blue-600' },
    sunrise: { name: 'Sunrise', icon: 'fa-sun', color: 'from-orange-400 to-orange-600' },
    dhuhr: { name: 'Dhuhr', icon: 'fa-sun', color: 'from-yellow-400 to-yellow-600' },
    asr: { name: 'Asr', icon: 'fa-cloud', color: 'from-orange-300 to-orange-500' },
    maghrib: { name: 'Maghrib', icon: 'fa-moon', color: 'from-purple-400 to-purple-600' },
    isha: { name: 'Isha', icon: 'fa-star', color: 'from-indigo-400 to-indigo-600' }
};

function initApp() {
    loadSettings();
    initServiceWorker();
    setupEventListeners();
    initTheme();
    updateCurrentTime();
    window.setInterval(updateCurrentTime, 1000);
    window.setInterval(checkNotificationPermissionState, 5000);
    renderNamesOfAllah();
    updateLocationDisplay();
    calculatePrayerTimes();
}

function initTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = userSettings.theme === 'dark' || (userSettings.theme === 'auto' && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeIcon(isDark);
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    userSettings.theme = isDark ? 'dark' : 'light';
    updateThemeIcon(isDark);
    saveSettings();
}

function updateCurrentTime() {
    const now = new Date();
    const timeStr = userSettings.timeFormat === '24h' 
        ? now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        : now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });
    document.getElementById('currentTime').textContent = timeStr;
    
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('currentDate').textContent = dateStr;
    
    const hijri = gregorianToHijri(now);
    document.getElementById('hijriDate').textContent = `${hijri.day} ${hijri.monthName} ${hijri.year} AH`;
}

function gregorianToHijri(date) {
    const jd = Math.floor((date.getTime() - Date.UTC(1970, 0, 1)) / 86400000) + 2440588;
    const l = jd - 1948440 + 10632;
    const n = Math.floor((l - 1) / 10631);
    const j = l - 10631 * n + 354;
    const j1 = (Math.floor((10985 - j) / 5316)) * (Math.floor((50 * j) / 17719)) + (Math.floor(j / 5670)) * (Math.floor((43 * j) / 15238));
    const j2 = j - (Math.floor((30 - j1) / 15)) * (Math.floor((17719 * j1) / 50)) - (Math.floor(j1 / 16)) * (Math.floor((15238 * j1) / 43)) + 29;
    const m = Math.floor((24 * j2) / 709);
    const d = j2 - Math.floor((709 * m) / 24);
    const y = 30 * n + j1 - 30;
    
    const months = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'];
    return { day: d, month: m, monthName: months[m - 1], year: y };
}

function detectLocation() {
    if (!navigator.geolocation) {
        updateLocationText('Geolocation is not supported by this browser.');
        return;
    }

    updateLocationText('Detecting location...');
    navigator.geolocation.getCurrentPosition(
        position => {
            userSettings.location = {
                lat: Number(position.coords.latitude.toFixed(6)),
                lng: Number(position.coords.longitude.toFixed(6))
            };
            userSettings.locationName = formatCoordinates(userSettings.location);
            saveSettings();
            updateLocationDisplay();
            calculatePrayerTimes();
        },
        () => {
            updateLocationDisplay();
            calculatePrayerTimes();
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
    );
}

function formatCoordinates(location) {
    if (!location || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
        return 'Location unavailable';
    }
    return `Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}`;
}

function updateLocationDisplay() {
    updateLocationText(userSettings.locationName || formatCoordinates(userSettings.location));
}

function updateLocationText(text) {
    document.getElementById('locationText').textContent = text;
}

function getBrowserTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function getTimeZoneOffsetHours(timeZone, date) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date);
        const value = parts.find(part => part.type === 'timeZoneName')?.value || 'GMT';
        const match = value.match(/GMT([+-])(\d{2})(?::(\d{2}))?/);
        if (!match) return 0;
        const sign = match[1] === '+' ? 1 : -1;
        return sign * (Number(match[2]) + Number(match[3] || 0) / 60);
    } catch (error) {
        return 0;
    }
}

function isValidTimeZone(timeZone) {
    if (typeof timeZone !== 'string' || !timeZone.trim()) return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone }).format();
        return true;
    } catch (error) {
        return false;
    }
}

function getTimeZoneDateParts(date, timeZone = userSettings.timeZone || getBrowserTimeZone()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return { year: Number(values.year), month: Number(values.month), day: Number(values.day) };
}

function zonedTimeToDate(year, month, day, hour, minute, timeZone) {
    const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const firstOffset = getTimeZoneOffsetHours(timeZone, new Date(utcGuess));
    const firstResult = new Date(utcGuess - firstOffset * 60 * 60 * 1000);
    const actualOffset = getTimeZoneOffsetHours(timeZone, firstResult);
    return actualOffset === firstOffset ? firstResult : new Date(utcGuess - actualOffset * 60 * 60 * 1000);
}

function addDaysInTimeZone(date, days, timeZone = userSettings.timeZone || getBrowserTimeZone()) {
    const parts = getTimeZoneDateParts(date, timeZone);
    const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days, 12, 0, 0));
    return zonedTimeToDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate(), 12, 0, timeZone);
}

function getPrayerTimesForDate(date) {
    const timeZone = userSettings.timeZone || getBrowserTimeZone();
    const parts = getTimeZoneDateParts(date, timeZone);
    const timezoneOffset = getTimeZoneOffsetHours(timeZone, date);
    return prayerTimesCalc.getTimes(
        [parts.year, parts.month, parts.day],
        [userSettings.location.lat, userSettings.location.lng],
        timezoneOffset,
        0,
        userSettings.timeFormat
    );
}

function calculatePrayerTimes() {
    const times = getPrayerTimesForDate(new Date());
    currentPrayerTimes = {
        fajr: times.fajr,
        sunrise: times.sunrise,
        dhuhr: times.dhuhr,
        asr: times.asr,
        maghrib: times.maghrib,
        isha: times.isha
    };
    renderPrayerTimes();
    updateNextPrayer();
    calculateQibla();
    updateLocationDisplay();
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
}

function renderPrayerTimes() {
    const container = document.getElementById('prayerTimes');
    container.innerHTML = '';
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    
    Object.entries(currentPrayerTimes).forEach(([key, time]) => {
        const info = prayerNames[key];
        const [h, m] = parseTime(time);
        const prayerHour = h + m / 60;
        const isActive = Math.abs(currentHour - prayerHour) < 0.5;
        const isPast = currentHour > prayerHour + 0.5;
        
        const row = document.createElement('div');
        row.className = `flex items-center justify-between p-4 ${isActive ? 'bg-teal-50 dark:bg-teal-900/30' : ''} ${isPast ? 'opacity-60' : ''}`;
        row.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br ${info.color} flex items-center justify-center text-white">
                    <i class="fas ${info.icon}"></i>
                </div>
                <div>
                    <p class="font-semibold text-gray-800 dark:text-white">${info.name}</p>
                    ${isActive ? '<span class="text-xs text-teal-600 font-medium">Current</span>' : ''}
                </div>
            </div>
            <span class="text-xl font-bold text-gray-800 dark:text-white">${time}</span>
        `;
        container.appendChild(row);
    });
}

function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return [0, 0];

    const trimmed = timeStr.trim();
    const hasPeriod = trimmed.includes('AM') || trimmed.includes('PM');

    if (hasPeriod) {
        const [time, period] = trimmed.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        return [h, m];
    } else {
        const [h, m] = trimmed.split(':').map(Number);
        return [h || 0, m || 0];
    }
}

function updateNextPrayer() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    let nextPrayer = null;
    let nextTime = null;
    let minDiff = Infinity;
    
    Object.entries(currentPrayerTimes).forEach(([key, time]) => {
        const [h, m] = parseTime(time);
        const prayerMinutes = h * 60 + m;
        const diff = prayerMinutes - currentMinutes;
        
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = key;
            nextTime = time;
        }
    });
    
    if (!nextPrayer) {
        const entries = Object.entries(currentPrayerTimes);
        nextPrayer = entries[0][0];
        nextTime = entries[0][1];
        minDiff = (24 * 60 - currentMinutes) + parseTime(nextTime)[0] * 60 + parseTime(nextTime)[1];
    }
    
    document.getElementById('nextPrayerName').textContent = prayerNames[nextPrayer].name;
    document.getElementById('nextPrayerTime').textContent = nextTime;
    
    updateCountdown(minDiff);
    
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        minDiff--;
        if (minDiff <= 0) {
            updateNextPrayer();
        } else {
            updateCountdown(minDiff);
        }
    }, 60000);
}

function updateCountdown(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const s = 0;
    document.getElementById('countdown').textContent = 
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function calculateQibla() {
    const makkahLat = 21.4225;
    const makkahLng = 39.8262;
    const userLat = userSettings.location.lat * Math.PI / 180;
    const userLng = userSettings.location.lng * Math.PI / 180;
    const makkahLatRad = makkahLat * Math.PI / 180;
    const makkahLngRad = makkahLng * Math.PI / 180;
    
    const y = Math.sin(makkahLngRad - userLng);
    const x = Math.cos(userLat) * Math.tan(makkahLatRad) - Math.sin(userLat) * Math.cos(makkahLngRad - userLng);
    
    let angle = Math.atan2(y, x) * 180 / Math.PI;
    angle = (angle + 360) % 360;
    qiblaAngle = angle;
    
    document.getElementById('qiblaDegree').textContent = `${Math.round(angle)}°`;
    document.getElementById('qiblaArrow').style.transform = 
        `translate(-50%, -100%) rotate(${angle}deg)`;
}

function enableDeviceCompass() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (event) => {
            let heading = event.alpha;
            if (event.webkitCompassHeading) {
                heading = event.webkitCompassHeading;
            }
            if (heading !== null) {
                const rotation = (qiblaAngle - heading + 360) % 360;
                document.getElementById('compass').style.transform = `rotate(${-heading}deg)`;
                document.getElementById('qiblaArrow').style.transform = 
                    `translate(-50%, -100%) rotate(${rotation}deg)`;
            }
        });
    }
}

function showTab(tab) {
    const panels = ['qiblaPanel', 'calendarPanel', 'tasbihPanel', 'namesPanel'];
    panels.forEach(p => document.getElementById(p).classList.add('hidden'));
    
    if (tab === 'qibla') {
        document.getElementById('qiblaPanel').classList.remove('hidden');
    } else if (tab === 'calendar') {
        document.getElementById('calendarPanel').classList.remove('hidden');
        renderCalendar();
    } else if (tab === 'tasbih') {
        document.getElementById('tasbihPanel').classList.remove('hidden');
    } else if (tab === 'names') {
        document.getElementById('namesPanel').classList.remove('hidden');
    }
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-teal-600', 'dark:text-teal-400');
        btn.classList.add('text-gray-400', 'dark:text-gray-500');
    });
}

function showMain() {
    ['qiblaPanel', 'calendarPanel', 'tasbihPanel', 'namesPanel'].forEach(p => 
        document.getElementById(p).classList.add('hidden'));
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-teal-600', 'dark:text-teal-400');
        btn.classList.add('text-gray-400', 'dark:text-gray-500');
    });
    document.querySelector('.nav-btn').classList.add('text-teal-600', 'dark:text-teal-400');
    document.querySelector('.nav-btn').classList.remove('text-gray-400', 'dark:text-gray-500');
}

function renderCalendar() {
    const date = new Date();
    date.setMonth(date.getMonth() + calendarOffset);
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonth').textContent = 
        `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    dayHeaders.forEach(d => {
        const cell = document.createElement('div');
        cell.className = 'text-xs font-bold text-gray-400 p-2';
        cell.textContent = d;
        grid.appendChild(cell);
    });
    
    for (let i = 0; i < startingDay; i++) {
        grid.appendChild(document.createElement('div'));
    }
    
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        const isToday = calendarOffset === 0 && d === today.getDate();
        const hijri = gregorianToHijri(new Date(date.getFullYear(), date.getMonth(), d));
        
        cell.className = `p-2 rounded-lg ${isToday ? 'bg-teal-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'} cursor-pointer`;
        cell.innerHTML = `
            <div class="font-bold">${d}</div>
            <div class="text-xs opacity-70">${hijri.day}</div>
        `;
        grid.appendChild(cell);
    }
}

function changeMonth(delta) {
    calendarOffset += delta;
    renderCalendar();
}

function setTasbihTarget(target) {
    userSettings.tasbihTarget = target;
    document.querySelectorAll('.tasbih-target').forEach(btn => {
        btn.classList.remove('bg-teal-100', 'dark:bg-teal-900', 'text-teal-700', 'dark:text-teal-300', 'active');
        btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
    });
    event.target.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
    event.target.classList.add('bg-teal-100', 'dark:bg-teal-900', 'text-teal-700', 'dark:text-teal-300', 'active');
}

function incrementTasbih() {
    tasbihCount++;
    document.getElementById('tasbihCount').textContent = tasbihCount;
    
    if (tasbihCount >= userSettings.tasbihTarget) {
        if (navigator.vibrate) navigator.vibrate(200);
    }
}

function resetTasbih() {
    tasbihCount = 0;
    document.getElementById('tasbihCount').textContent = '0';
}

function setDhikr(dhikr) {
    userSettings.currentDhikr = dhikr;
    document.querySelectorAll('.dhikr-btn').forEach(btn => {
        btn.classList.remove('bg-teal-100', 'dark:bg-teal-900', 'text-teal-700', 'dark:text-teal-300', 'active');
        btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
    });
    event.target.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-600', 'dark:text-gray-400');
    event.target.classList.add('bg-teal-100', 'dark:bg-teal-900', 'text-teal-700', 'dark:text-teal-300', 'active');
}

function renderNamesOfAllah() {
    const container = document.getElementById('namesList');
    if (!container || !Array.isArray(namesOfAllah)) return;
    const query = (document.getElementById('namesSearch')?.value || '').trim().toLocaleLowerCase();
    const filtered = namesOfAllah.filter(name =>
        name.en.toLocaleLowerCase().includes(query) ||
        name.meaning.toLocaleLowerCase().includes(query) ||
        name.ar.includes(query)
    );

    container.innerHTML = '';
    filtered.forEach(name => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'name-card text-left bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 hover:shadow-md transition focus-visible:ring-2 focus-visible:ring-teal-500';
        button.setAttribute('aria-label', `Name ${name.number}: ${name.en}, ${name.meaning}`);

        const number = document.createElement('span');
        number.className = 'text-xs font-semibold text-teal-600 dark:text-teal-400';
        number.textContent = String(name.number).padStart(2, '0');

        const arabic = document.createElement('p');
        arabic.className = 'text-lg font-bold text-teal-700 dark:text-teal-300 mt-1';
        arabic.dir = 'rtl';
        arabic.lang = 'ar';
        arabic.textContent = name.ar;

        const english = document.createElement('p');
        english.className = 'text-xs font-semibold text-gray-700 dark:text-gray-200 mt-1';
        english.textContent = name.en;

        const meaning = document.createElement('p');
        meaning.className = 'text-xs text-gray-500 dark:text-gray-400 mt-1';
        meaning.textContent = name.meaning;

        button.append(number, arabic, english, meaning);
        button.addEventListener('click', () => openNameDetails(name));
        container.appendChild(button);
    });

    const resultCount = document.getElementById('namesResultCount');
    if (resultCount) resultCount.textContent = query ? `${filtered.length} of ${namesOfAllah.length} names shown` : `${namesOfAllah.length} names`;
}

function openNameDetails(name) {
    const dialog = document.getElementById('nameDetailDialog');
    if (!dialog) return;
    document.getElementById('nameDetailNumber').textContent = `Name ${name.number}`;
    document.getElementById('nameDetailArabic').textContent = name.ar;
    document.getElementById('nameDetailEnglish').textContent = name.en;
    document.getElementById('nameDetailMeaning').textContent = name.meaning;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.removeAttribute('hidden');
}

function closeNameDetails() {
    const dialog = document.getElementById('nameDetailDialog');
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.setAttribute('hidden', '');
}

function setupEventListeners() {
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('enableCompass')?.addEventListener('click', enableDeviceCompass);

    document.getElementById('calcMethod')?.addEventListener('change', event => {
        if (!CALCULATION_METHODS.includes(event.target.value)) return;
        userSettings.calcMethod = event.target.value;
        prayerTimesCalc.setMethod(event.target.value);
        saveSettings();
        calculatePrayerTimes();
    });

    document.getElementById('madhab')?.addEventListener('change', event => {
        if (!MADHABS.includes(event.target.value)) return;
        userSettings.madhab = event.target.value;
        prayerTimesCalc.adjust({ asrMethod: event.target.value === 'Hanafi' ? 2 : 1 });
        saveSettings();
        calculatePrayerTimes();
    });

    document.getElementById('timeFormat')?.addEventListener('change', event => {
        userSettings.timeFormat = event.target.checked ? '24h' : '12h';
        saveSettings();
        calculatePrayerTimes();
        updateCurrentTime();
    });

    document.getElementById('notifications')?.addEventListener('change', async event => {
        if (!event.target.checked) {
            userSettings.notifications = false;
            saveSettings();
            updateNotificationStatus();
            return;
        }

        if (!('Notification' in window)) {
            event.target.checked = false;
            userSettings.notifications = false;
            updateNotificationStatus('Browser notifications are not supported.');
            return;
        }

        const permission = Notification.permission === 'default'
            ? await Notification.requestPermission()
            : Notification.permission;
        userSettings.notifications = permission === 'granted';
        event.target.checked = userSettings.notifications;
        saveSettings();
        updateNotificationStatus(userSettings.notifications ? 'Browser notification permission is enabled.' : 'Browser notification permission was not granted.');
    });

    document.getElementById('detectLocationButton')?.addEventListener('click', detectLocation);
    document.getElementById('saveLocationSettings')?.addEventListener('click', saveLocationSettings);
    document.getElementById('resetSettings')?.addEventListener('click', resetSettings);
    document.getElementById('namesSearch')?.addEventListener('input', renderNamesOfAllah);
    document.getElementById('closeNameDialog')?.addEventListener('click', closeNameDetails);
    document.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab)));

    syncSettingsControls();
    updateNotificationStatus();
}

function syncSettingsControls() {
    const calcMethod = document.getElementById('calcMethod');
    const madhab = document.getElementById('madhab');
    const timeFormat = document.getElementById('timeFormat');
    const notifications = document.getElementById('notifications');
    if (calcMethod) calcMethod.value = userSettings.calcMethod;
    if (madhab) madhab.value = userSettings.madhab;
    if (timeFormat) timeFormat.checked = userSettings.timeFormat === '24h';
    if (notifications) notifications.checked = userSettings.notifications;

    const latitudeInput = document.getElementById('latitudeInput');
    const longitudeInput = document.getElementById('longitudeInput');
    const timezoneInput = document.getElementById('timezoneInput');
    if (latitudeInput) latitudeInput.value = userSettings.location.lat.toFixed(6);
    if (longitudeInput) longitudeInput.value = userSettings.location.lng.toFixed(6);
    if (timezoneInput) timezoneInput.value = userSettings.timeZone;
}

function saveLocationSettings() {
    const latitude = Number(document.getElementById('latitudeInput')?.value);
    const longitude = Number(document.getElementById('longitudeInput')?.value);
    const timeZone = document.getElementById('timezoneInput')?.value.trim();

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setSettingsMessage('Enter a valid latitude and longitude.', true);
        return;
    }

    if (!isValidTimeZone(timeZone)) {
        setSettingsMessage('Enter a valid IANA timezone, for example Asia/Kolkata.', true);
        return;
    }

    userSettings.location = { lat: Number(latitude.toFixed(6)), lng: Number(longitude.toFixed(6)) };
    userSettings.locationName = formatCoordinates(userSettings.location);
    userSettings.timeZone = timeZone;
    saveSettings();
    syncSettingsControls();
    updateLocationDisplay();
    calculatePrayerTimes();
    setSettingsMessage('Prayer location saved.');
}

function setSettingsMessage(message, error = false) {
    const element = document.getElementById('locationSettingsMessage');
    if (!element) return;
    element.textContent = message;
    element.className = error ? 'mt-2 text-xs text-red-600 dark:text-red-400' : 'mt-2 text-xs text-teal-600 dark:text-teal-400';
}

function resetSettings() {
    if (!window.confirm('Reset DeenTime settings stored on this device?')) return;
    safeStorageRemove(SETTINGS_STORAGE_KEY);
    safeStorageRemove(LEGACY_SETTINGS_STORAGE_KEY);
    Object.assign(userSettings, getDefaultSettings());
    tasbihCount = 0;
    safeStorageRemove('deenTimeTasbihState');
    saveSettings();
    syncSettingsControls();
    initTheme();
    updateLocationDisplay();
    renderNamesOfAllah();
    calculatePrayerTimes();
    setSettingsMessage('Local DeenTime settings were reset.');
}

function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'DEENTIME_SW_UPDATED') document.getElementById('updateNotice')?.classList.remove('hidden');
    });
    navigator.serviceWorker.register('./service-worker.js').then(registration => registration.update()).catch(() => {});
}

const SETTINGS_STORAGE_KEY = 'deenTimeSettings';
const LEGACY_SETTINGS_STORAGE_KEY = 'azaanSettings';
const CALCULATION_METHODS = ['MWL', 'ISNA', 'Egypt', 'Makkah', 'Karachi', 'Tehran', 'Jafari'];
const MADHABS = ['Standard', 'Hanafi'];
const TIME_FORMATS = ['12h', '24h'];
const THEMES = ['auto', 'light', 'dark'];

function getDefaultSettings() {
    return { location: { lat: 21.4225, lng: 39.8262 }, calcMethod: 'MWL', madhab: 'Standard', notifications: false, timeFormat: '24h', theme: 'auto', tasbihTarget: 33, currentDhikr: 'SubhanAllah', locationName: 'Makkah, Saudi Arabia', timeZone: 'Asia/Riyadh' };
}

function safeStorageGet(key) { try { return window.localStorage.getItem(key); } catch (error) { return null; } }
function safeStorageSet(key, value) { try { window.localStorage.setItem(key, value); return true; } catch (error) { return false; } }
function safeStorageRemove(key) { try { window.localStorage.removeItem(key); } catch (error) {} }

function normalizeSettings(saved) {
    const defaults = getDefaultSettings();
    const source = saved && typeof saved === 'object' ? saved : {};
    const location = source.location && typeof source.location === 'object' ? source.location : {};
    const lat = Number(location.lat);
    const lng = Number(location.lng);
    return {
        location: { lat: Number.isFinite(lat) && lat >= -90 && lat <= 90 ? lat : defaults.location.lat, lng: Number.isFinite(lng) && lng >= -180 && lng <= 180 ? lng : defaults.location.lng },
        calcMethod: CALCULATION_METHODS.includes(source.calcMethod) ? source.calcMethod : defaults.calcMethod,
        madhab: MADHABS.includes(source.madhab) ? source.madhab : defaults.madhab,
        notifications: source.notifications === true,
        timeFormat: TIME_FORMATS.includes(source.timeFormat) ? source.timeFormat : defaults.timeFormat,
        theme: THEMES.includes(source.theme) ? source.theme : defaults.theme,
        tasbihTarget: [33, 99, 100].includes(Number(source.tasbihTarget)) ? Number(source.tasbihTarget) : defaults.tasbihTarget,
        currentDhikr: typeof source.currentDhikr === 'string' && source.currentDhikr.trim() ? source.currentDhikr : defaults.currentDhikr,
        locationName: typeof source.locationName === 'string' && source.locationName.trim() ? source.locationName : defaults.locationName,
        timeZone: isValidTimeZone(source.timeZone) ? source.timeZone : defaults.timeZone
    };
}

function saveSettings() {
    safeStorageSet(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
}

function loadSettings() {
    const raw = safeStorageGet(SETTINGS_STORAGE_KEY) || safeStorageGet(LEGACY_SETTINGS_STORAGE_KEY);
    let saved = null;
    try { saved = raw ? JSON.parse(raw) : null; } catch (error) { saved = null; }
    Object.assign(userSettings, normalizeSettings(saved));
    prayerTimesCalc.setMethod(userSettings.calcMethod);
    prayerTimesCalc.adjust({ asrMethod: userSettings.madhab === 'Hanafi' ? 2 : 1 });
}

function updateNotificationStatus(message) {
    const status = document.getElementById('notificationStatus');
    if (!status) return;
    if (message) { status.textContent = message; return; }
    if (!('Notification' in window)) { status.textContent = 'Not supported by this browser.'; return; }
    status.textContent = Notification.permission === 'granted' ? 'Browser permission enabled.' : 'No browser permission granted.';
}

function checkNotificationPermissionState() {
    if (!userSettings.notifications || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') {
        userSettings.notifications = false;
        const toggle = document.getElementById('notifications');
        if (toggle) toggle.checked = false;
        saveSettings();
        updateNotificationStatus();
    }
}

document.addEventListener('DOMContentLoaded', initApp);
