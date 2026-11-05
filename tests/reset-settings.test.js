const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('script-core.js', 'utf8');
const resetSource = source.match(/function resetSettings\(\) \{[\s\S]*?\n\}/u);
assert.ok(resetSource, 'resetSettings is missing from script-core.js');

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /<button id="resetSettings" type="button"/u, 'reset control should be a keyboard-operable button');

function createHarness(confirmAnswer) {
    const storage = new Map([
        ['deenTimeSettings', '{"calcMethod":"ISNA"}'],
        ['azaanSettings', '{"calcMethod":"Egypt"}'],
        ['deenTimeTasbihState', '{"count":17,"target":99,"dhikr":"Alhamdulillah"}'],
        ['unrelatedAppData', 'keep me']
    ]);
    const calls = [];
    const prompts = [];
    const context = {
        SETTINGS_STORAGE_KEY: 'deenTimeSettings',
        LEGACY_SETTINGS_STORAGE_KEY: 'azaanSettings',
        tasbihCount: 17,
        userSettings: { calcMethod: 'ISNA', theme: 'dark', tasbihTarget: 99, currentDhikr: 'Alhamdulillah' },
        window: { confirm: message => { prompts.push(message); return confirmAnswer; } },
        getDefaultSettings: () => ({ calcMethod: 'MWL', theme: 'auto', tasbihTarget: 33, currentDhikr: 'SubhanAllah' }),
        safeStorageRemove: key => storage.delete(key),
        saveSettings() { storage.set('deenTimeSettings', JSON.stringify(context.userSettings)); },
        phase7ApplyTasbihState: state => calls.push(['tasbih', { ...state }]),
        syncSettingsControls: () => calls.push(['sync']),
        initTheme: () => calls.push(['theme']),
        updateLocationDisplay: () => calls.push(['location']),
        renderNamesOfAllah: () => calls.push(['names']),
        calculatePrayerTimes: () => calls.push(['prayers']),
        setSettingsMessage: message => calls.push(['message', message])
    };
    vm.createContext(context);
    vm.runInContext(resetSource[0], context);
    vm.runInContext('resetSettings()', context);
    return { context, storage, calls, prompts };
}

const cancelled = createHarness(false);
assert.equal(cancelled.prompts.length, 1, 'reset should ask for confirmation');
assert.match(cancelled.prompts[0], /settings/iu, 'confirmation should say settings will be reset');
assert.match(cancelled.prompts[0], /Tasbih/u, 'confirmation should say the Tasbih count will be cleared');
assert.equal(cancelled.storage.size, 4, 'cancel should leave stored data unchanged');
assert.equal(cancelled.context.userSettings.calcMethod, 'ISNA', 'cancel should leave settings unchanged');
assert.equal(cancelled.context.tasbihCount, 17, 'cancel should leave the Tasbih count unchanged');
assert.deepEqual(cancelled.calls, [], 'cancel should not refresh the UI');

const confirmed = createHarness(true);
assert.equal(confirmed.storage.has('azaanSettings'), false, 'confirm should remove legacy settings');
assert.equal(confirmed.storage.has('deenTimeTasbihState'), false, 'confirm should remove Tasbih state');
assert.equal(confirmed.storage.get('unrelatedAppData'), 'keep me', 'confirm should not clear unrelated data');
assert.deepEqual(JSON.parse(confirmed.storage.get('deenTimeSettings')), { calcMethod: 'MWL', theme: 'auto', tasbihTarget: 33, currentDhikr: 'SubhanAllah' }, 'confirm should store default settings');
assert.equal(confirmed.context.tasbihCount, 0, 'confirm should reset the Tasbih count');
assert.deepEqual(confirmed.calls.find(([name]) => name === 'tasbih'), ['tasbih', { count: 0, target: 33, dhikr: 'SubhanAllah' }], 'confirm should refresh the Tasbih display');
assert.deepEqual(confirmed.calls.at(-1), ['message', 'Local DeenTime settings were reset.'], 'confirm should report the reset');

console.log('Reset settings confirmation tests passed');
