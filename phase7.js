const phase7TasbihTargets = [33, 99, 100];
const phase7TasbihStorageKey = 'deenTimeTasbihState';

function createTasbihState(source = {}) {
    const target = phase7TasbihTargets.includes(Number(source.target)) ? Number(source.target) : 33;
    const count = Number.isInteger(Number(source.count)) && Number(source.count) >= 0 ? Number(source.count) : 0;
    const dhikr = typeof source.dhikr === 'string' && source.dhikr.trim() ? source.dhikr : 'SubhanAllah';
    return { count, target, dhikr };
}

function phase7TasbihReducer(state, action) {
    const current = createTasbihState(state);
    if (action.type === 'increment') return { ...current, count: current.count + 1 };
    if (action.type === 'reset') return { ...current, count: 0 };
    if (action.type === 'target' && phase7TasbihTargets.includes(Number(action.value))) return { ...current, target: Number(action.value) };
    if (action.type === 'dhikr' && typeof action.value === 'string' && action.value.trim()) return { ...current, dhikr: action.value };
    return current;
}

function phase7ReadTasbihState() {
    try {
        const saved = localStorage.getItem(phase7TasbihStorageKey);
        return saved ? createTasbihState(JSON.parse(saved)) : createTasbihState(userSettings);
    } catch (error) {
        return createTasbihState(userSettings);
    }
}

function phase7WriteTasbihState(state) {
    try {
        localStorage.setItem(phase7TasbihStorageKey, JSON.stringify(state));
    } catch (error) {
        return false;
    }
    return true;
}

function phase7ApplyTasbihState(state) {
    const next = createTasbihState(state);
    tasbihCount = next.count;
    userSettings.tasbihTarget = next.target;
    userSettings.currentDhikr = next.dhikr;

    const count = document.getElementById('tasbihCount');
    if (count) {
        count.textContent = String(next.count);
        count.setAttribute('aria-label', 'Tasbih count: ' + next.count);
    }

    document.querySelectorAll('.tasbih-target').forEach(button => {
        const active = Number(button.textContent.trim()) === next.target;
        button.classList.toggle('bg-teal-100', active);
        button.classList.toggle('dark:bg-teal-900', active);
        button.classList.toggle('text-teal-700', active);
        button.classList.toggle('dark:text-teal-300', active);
        button.classList.toggle('active', active);
        button.classList.toggle('bg-gray-100', !active);
        button.classList.toggle('dark:bg-gray-700', !active);
        button.classList.toggle('text-gray-600', !active);
        button.classList.toggle('dark:text-gray-400', !active);
        button.setAttribute('aria-pressed', String(active));
    });

    document.querySelectorAll('.dhikr-btn').forEach(button => {
        const active = button.textContent.trim() === next.dhikr;
        button.classList.toggle('bg-teal-100', active);
        button.classList.toggle('dark:bg-teal-900', active);
        button.classList.toggle('text-teal-700', active);
        button.classList.toggle('dark:text-teal-300', active);
        button.classList.toggle('active', active);
        button.classList.toggle('bg-gray-100', !active);
        button.classList.toggle('dark:bg-gray-700', !active);
        button.classList.toggle('text-gray-600', !active);
        button.classList.toggle('dark:text-gray-400', !active);
        button.setAttribute('aria-pressed', String(active));
    });

    const status = document.getElementById('tasbihStatus');
    if (status) status.textContent = next.dhikr + ': ' + next.count + ' of ' + next.target;
}

function phase7PersistTasbihState() {
    const state = createTasbihState({
        count: tasbihCount,
        target: userSettings.tasbihTarget,
        dhikr: userSettings.currentDhikr
    });
    phase7WriteTasbihState(state);
    if (typeof saveSettings === 'function') saveSettings();
    phase7ApplyTasbihState(state);
}

function setTasbihTarget(target) {
    const state = phase7TasbihReducer({ count: tasbihCount, target: userSettings.tasbihTarget, dhikr: userSettings.currentDhikr }, { type: 'target', value: target });
    phase7PersistTasbihState(state);
}

function incrementTasbih() {
    const state = phase7TasbihReducer({ count: tasbihCount, target: userSettings.tasbihTarget, dhikr: userSettings.currentDhikr }, { type: 'increment' });
    phase7PersistTasbihState(state);
    if (state.count === state.target && navigator.vibrate) navigator.vibrate(200);
}

function resetTasbih() {
    const state = phase7TasbihReducer({ count: tasbihCount, target: userSettings.tasbihTarget, dhikr: userSettings.currentDhikr }, { type: 'reset' });
    phase7PersistTasbihState(state);
}

function setDhikr(dhikr) {
    const state = phase7TasbihReducer({ count: tasbihCount, target: userSettings.tasbihTarget, dhikr: userSettings.currentDhikr }, { type: 'dhikr', value: dhikr });
    phase7PersistTasbihState(state);
}

function setupPhase7Tasbih() {
    const panel = document.getElementById('tasbihPanel');
    if (!panel) return;

    const count = document.getElementById('tasbihCount');
    if (count) {
        count.setAttribute('role', 'status');
        count.setAttribute('aria-live', 'polite');
    }

    let status = document.getElementById('tasbihStatus');
    if (!status) {
        status = document.createElement('p');
        status.id = 'tasbihStatus';
        status.className = 'text-center text-sm text-gray-500 dark:text-gray-400 mt-3';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        panel.querySelector('.text-center').appendChild(status);
    }

    panel.querySelectorAll('.tasbih-target').forEach(button => {
        button.setAttribute('type', 'button');
    });
    panel.querySelectorAll('.dhikr-btn').forEach(button => {
        button.setAttribute('type', 'button');
    });

    const countButton = panel.querySelector('button[onclick="incrementTasbih()"]');
    const resetButton = panel.querySelector('button[onclick="resetTasbih()"]');
    if (countButton) countButton.setAttribute('aria-label', 'Increment Tasbih count');
    if (resetButton) resetButton.setAttribute('aria-label', 'Reset Tasbih count');

    phase7ApplyTasbihState(phase7ReadTasbihState());
}

document.addEventListener('DOMContentLoaded', setupPhase7Tasbih);
