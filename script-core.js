const userSettings = {
    location: { lat: 21.4225, lng: 39.8262 },
    calcMethod: 'MWL',
    madhab: 'Standard',
    notifications: false,
    timeFormat: '24h',
    theme: 'auto',
    tasbihTarget: 33,
    currentDhikr: 'SubhanAllah'
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

const namesOfAllah = [
    { ar: 'الرحمن', en: 'Ar-Rahman', meaning: 'The Beneficent' },
    { ar: 'الرحيم', en: 'Ar-Rahim', meaning: 'The Merciful' },
    { ar: 'الملك', en: 'Al-Malik', meaning: 'The King' },
    { ar: 'القدوس', en: 'Al-Quddus', meaning: 'The Holy' },
    { ar: 'السلام', en: 'As-Salam', meaning: 'The Peace' },
    { ar: 'المؤمن', en: 'Al-Mumin', meaning: 'The Guardian of Faith' },
    { ar: 'المهيمن', en: 'Al-Muhaymin', meaning: 'The Protector' },
    { ar: 'العزيز', en: 'Al-Aziz', meaning: 'The Mighty' },
    { ar: 'الجبار', en: 'Al-Jabbar', meaning: 'The Compeller' },
    { ar: 'المتكبر', en: 'Al-Mutakabbir', meaning: 'The Majestic' },
    { ar: 'الخالق', en: 'Al-Khaliq', meaning: 'The Creator' },
    { ar: 'البارئ', en: 'Al-Bari', meaning: 'The Evolver' },
    { ar: 'المصور', en: 'Al-Musawwir', meaning: 'The Fashioner' },
    { ar: 'الغفار', en: 'Al-Ghaffar', meaning: 'The Forgiver' },
    { ar: 'القهار', en: 'Al-Qahhar', meaning: 'The Subduer' },
    { ar: 'الوهاب', en: 'Al-Wahhab', meaning: 'The Bestower' },
    { ar: 'الرزاق', en: 'Ar-Razzaq', meaning: 'The Provider' },
    { ar: 'الفتاح', en: 'Al-Fattah', meaning: 'The Opener' },
    { ar: 'العليم', en: 'Al-Alim', meaning: 'The All-Knowing' },
    { ar: 'القابض', en: 'Al-Qabid', meaning: 'The Constrictor' },
    { ar: 'الباسط', en: 'Al-Basit', meaning: 'The Expander' },
    { ar: 'الخافض', en: 'Al-Khafid', meaning: 'The Abaser' },
    { ar: 'الرافع', en: 'Ar-Rafi', meaning: 'The Exalter' },
    { ar: 'المعز', en: 'Al-Muizz', meaning: 'The Honorer' },
    { ar: 'المذل', en: 'Al-Mudhill', meaning: 'The Humiliator' },
    { ar: 'السميع', en: 'As-Sami', meaning: 'The All-Hearing' },
    { ar: 'البصير', en: 'Al-Basir', meaning: 'The All-Seeing' },
    { ar: 'الحكم', en: 'Al-Hakam', meaning: 'The Judge' },
    { ar: 'العدل', en: 'Al-Adl', meaning: 'The Just' },
    { ar: 'اللطيف', en: 'Al-Latif', meaning: 'The Gentle' },
    { ar: 'الخبير', en: 'Al-Khabir', meaning: 'The Aware' },
    { ar: 'الحليم', en: 'Al-Halim', meaning: 'The Forbearing' },
    { ar: 'العظيم', en: 'Al-Azim', meaning: 'The Magnificent' },
    { ar: 'الغفور', en: 'Al-Ghafur', meaning: 'The Forgiver' },
    { ar: 'الشكور', en: 'Ash-Shakur', meaning: 'The Appreciative' },
    { ar: 'العلي', en: 'Al-Ali', meaning: 'The Most High' },
    { ar: 'الكبير', en: 'Al-Kabir', meaning: 'The Great' },
    { ar: 'الحفيظ', en: 'Al-Hafiz', meaning: 'The Preserver' },
    { ar: 'المقيت', en: 'Al-Muqit', meaning: 'The Nourisher' },
    { ar: 'الحسيب', en: 'Al-Hasib', meaning: 'The Reckoner' },
    { ar: 'الجليل', en: 'Al-Jalil', meaning: 'The Sublime' },
    { ar: 'الكريم', en: 'Al-Karim', meaning: 'The Generous' },
    { ar: 'الرقيب', en: 'Ar-Raqib', meaning: 'The Watchful' },
    { ar: 'المجيب', en: 'Al-Mujib', meaning: 'The Responsive' },
    { ar: 'الواسع', en: 'Al-Wasi', meaning: 'The All-Embracing' },
    { ar: 'الحكيم', en: 'Al-Hakim', meaning: 'The Wise' },
    { ar: 'الودود', en: 'Al-Wadud', meaning: 'The Loving' },
    { ar: 'المجيد', en: 'Al-Majid', meaning: 'The Glorious' },
    { ar: 'الباعث', en: 'Al-Baith', meaning: 'The Resurrector' },
    { ar: 'الشهيد', en: 'Ash-Shahid', meaning: 'The Witness' },
    { ar: 'الحق', en: 'Al-Haqq', meaning: 'The Truth' },
    { ar: 'الوكيل', en: 'Al-Wakil', meaning: 'The Trustee' },
    { ar: 'القوي', en: 'Al-Qawiyy', meaning: 'The Strong' },
    { ar: 'المتين', en: 'Al-Matin', meaning: 'The Firm' },
    { ar: 'الولي', en: 'Al-Waliyy', meaning: 'The Protecting Friend' },
    { ar: 'الحميد', en: 'Al-Hamid', meaning: 'The Praiseworthy' },
    { ar: 'المحصي', en: 'Al-Muhsi', meaning: 'The Counter' },
    { ar: 'المبدئ', en: 'Al-Mubdi', meaning: 'The Originator' },
    { ar: 'المعيد', en: 'Al-Muid', meaning: 'The Restorer' },
    { ar: 'المحيي', en: 'Al-Muhyi', meaning: 'The Giver of Life' },
    { ar: 'المميت', en: 'Al-Mumit', meaning: 'The Creator of Death' },
    { ar: 'الحي', en: 'Al-Hayy', meaning: 'The Alive' },
    { ar: 'القيوم', en: 'Al-Qayyum', meaning: 'The Self-Subsisting' },
    { ar: 'الواجد', en: 'Al-Wajid', meaning: 'The Finder' },
    { ar: 'الماجد', en: 'Al-Majid', meaning: 'The Noble' },
    { ar: 'الواحد', en: 'Al-Wahid', meaning: 'The One' },
    { ar: 'الأحد', en: 'Al-Ahad', meaning: 'The Unique' },
    { ar: 'الصمد', en: 'As-Samad', meaning: 'The Eternal' },
    { ar: 'القادر', en: 'Al-Qadir', meaning: 'The Able' },
    { ar: 'المقتدر', en: 'Al-Muqtadir', meaning: 'The Powerful' },
    { ar: 'المقدم', en: 'Al-Muqaddim', meaning: 'The Expediter' },
    { ar: 'المؤخر', en: 'Al-Muakhkhir', meaning: 'The Delayer' },
    { ar: 'الأول', en: 'Al-Awwal', meaning: 'The First' },
    { ar: 'الآخر', en: 'Al-Akhir', meaning: 'The Last' },
    { ar: 'الظاهر', en: 'Az-Zahir', meaning: 'The Manifest' },
    { ar: 'الباطن', en: 'Al-Batin', meaning: 'The Hidden' },
    { ar: 'الوالي', en: 'Al-Wali', meaning: 'The Governor' },
    { ar: 'المتعالي', en: 'Al-Mutaali', meaning: 'The Most Exalted' },
    { ar: 'البر', en: 'Al-Barr', meaning: 'The Source of Goodness' },
    { ar: 'التواب', en: 'At-Tawwab', meaning: 'The Acceptor of Repentance' },
    { ar: 'المنتقم', en: 'Al-Muntaqim', meaning: 'The Avenger' },
    { ar: 'العفو', en: 'Al-Afuww', meaning: 'The Pardoner' },
    { ar: 'الرؤوف', en: 'Ar-Rauf', meaning: 'The Compassionate' },
    { ar: 'مالك الملك', en: 'Malik-ul-Mulk', meaning: 'The Owner of All' },
    { ar: 'ذو الجلال والإكرام', en: 'Dhu-l-Jalal wa-l-Ikram', meaning: 'The Lord of Majesty and Bounty' },
    { ar: 'المقسط', en: 'Al-Muqsit', meaning: 'The Equitable' },
    { ar: 'الجامع', en: 'Al-Jami', meaning: 'The Gatherer' },
    { ar: 'الغني', en: 'Al-Ghani', meaning: 'The Self-Sufficient' },
    { ar: 'المغني', en: 'Al-Mughni', meaning: 'The Enricher' },
    { ar: 'المانع', en: 'Al-Mani', meaning: 'The Preventer' },
    { ar: 'الضار', en: 'Ad-Darr', meaning: 'The Distresser' },
    { ar: 'النافع', en: 'An-Nafi', meaning: 'The Propitious' },
    { ar: 'النور', en: 'An-Nur', meaning: 'The Light' },
    { ar: 'الهادي', en: 'Al-Hadi', meaning: 'The Guide' },
    { ar: 'البديع', en: 'Al-Badi', meaning: 'The Incomparable' },
    { ar: 'الباقي', en: 'Al-Baqi', meaning: 'The Everlasting' },
    { ar: 'الوارث', en: 'Al-Warith', meaning: 'The Inheritor' },
    { ar: 'الرشيد', en: 'Ar-Rashid', meaning: 'The Guide to the Right Path' },
    { ar: 'الصبور', en: 'As-Sabur', meaning: 'The Patient' }
];

function initApp() {
    loadSettings();
    initServiceWorker();
    setupEventListeners();
    initTheme();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    detectLocation();
    renderNamesOfAllah();
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
        updateLocationText('Geolocation not supported');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        position => {
            userSettings.location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            saveSettings();
            getLocationName(userSettings.location.lat, userSettings.location.lng);
            calculatePrayerTimes();
        },
        error => {
            updateLocationText('Location access denied');
            calculatePrayerTimes();
        },
        { timeout: 10000, enableHighAccuracy: true }
    );
}

function getLocationName(lat, lng) {
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)
        .then(res => res.json())
        .then(data => {
            const location = data.city || data.locality || data.principalSubdivision || 'Unknown Location';
            updateLocationText(location);
        })
        .catch(() => updateLocationText(`${lat.toFixed(2)}, ${lng.toFixed(2)}`));
}

function updateLocationText(text) {
    document.getElementById('locationText').textContent = text;
}

function calculatePrayerTimes() {
    const date = new Date();
    const times = prayerTimesCalc.getTimes(
        [date.getFullYear(), date.getMonth() + 1, date.getDate()],
        [userSettings.location.lat, userSettings.location.lng],
        date.getTimezoneOffset() / -60,
        0,
        userSettings.timeFormat
    );
    
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
    document.getElementById('loading').style.display = 'none';
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
    container.innerHTML = '';
    
    namesOfAllah.forEach((name, index) => {
        const card = document.createElement('div');
        card.className = 'bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-3 text-center cursor-pointer hover:shadow-md transition';
        card.innerHTML = `
            <p class="text-lg font-bold text-teal-700 dark:text-teal-300">${name.ar}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">${name.en}</p>
            <p class="text-xs text-gray-500 dark:text-gray-500">${name.meaning}</p>
        `;
        card.onclick = () => {
            alert(`${name.ar}\
${name.en}\
${name.meaning}`);
        };
        container.appendChild(card);
    });
}

function setupEventListeners() {
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('enableCompass').addEventListener('click', enableDeviceCompass);
    document.getElementById('calcMethod').addEventListener('change', (e) => {
        userSettings.calcMethod = e.target.value;
        prayerTimesCalc.setMethod(e.target.value);
        saveSettings();
        calculatePrayerTimes();
    });
    document.getElementById('madhab').addEventListener('change', (e) => {
        userSettings.madhab = e.target.value;
        prayerTimesCalc.adjust({ asrMethod: e.target.value === 'Hanafi' ? 2 : 1 });
        saveSettings();
        calculatePrayerTimes();
    });
    document.getElementById('timeFormat').addEventListener('change', (e) => {
        userSettings.timeFormat = e.target.checked ? '24h' : '12h';
        saveSettings();
        calculatePrayerTimes();
        updateCurrentTime();
    });
    document.getElementById('notifications').addEventListener('change', (e) => {
        userSettings.notifications = e.target.checked;
        saveSettings();
        if (e.target.checked && 'Notification' in window) {
            Notification.requestPermission();
        }
    });
}

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(reg => console.log('SW registered'))
            .catch(err => console.log('SW error:', err));
    }
}

function saveSettings() {
    localStorage.setItem('azaanSettings', JSON.stringify(userSettings));
}

function loadSettings() {
    const saved = localStorage.getItem('azaanSettings');
    if (saved) {
        Object.assign(userSettings, JSON.parse(saved));
    }
    
    document.getElementById('calcMethod').value = userSettings.calcMethod;
    document.getElementById('madhab').value = userSettings.madhab;
    document.getElementById('timeFormat').checked = userSettings.timeFormat === '24h';
    document.getElementById('notifications').checked = userSettings.notifications;
    
    prayerTimesCalc.setMethod(userSettings.calcMethod);
    prayerTimesCalc.adjust({ asrMethod: userSettings.madhab === 'Hanafi' ? 2 : 1 });
}

document.addEventListener('DOMContentLoaded', initApp);
