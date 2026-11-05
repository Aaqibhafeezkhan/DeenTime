const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'phase7.js'), 'utf8');

function createElement(id) {
    return {
        id,
        textContent: '',
        setAttribute() {},
        classList: { toggle() {} },
        appendChild(element) { elements[element.id] = element; }
    };
}

const elements = { tasbihCount: createElement('tasbihCount') };
elements.tasbihPanel = {
    querySelector: selector => (selector === '.text-center' ? createElement('panelContent') : null),
    querySelectorAll: () => []
};

function createContext(navigator) {
    const listeners = {};
    const context = {
        navigator,
        userSettings: { tasbihTarget: 33, currentDhikr: 'SubhanAllah' },
        saveSettings() {},
        document: {
            addEventListener(type, listener) { listeners[type] = listener; },
            getElementById: id => elements[id] || null,
            querySelectorAll: () => [],
            createElement: () => createElement('tasbihStatus')
        },
        localStorage: { getItem: () => null, setItem() {} }
    };
    vm.createContext(context);
    vm.runInContext('var tasbihCount = 0;', context);
    vm.runInContext(source, context);
    listeners.DOMContentLoaded();
    return context;
}

const status = () => elements.tasbihStatus.textContent;
const vibrations = [];
const context = createContext({ vibrate: duration => vibrations.push(duration) });
const run = code => vm.runInContext(code, context);

run('setDhikr("Alhamdulillah"); for (let i = 0; i < 32; i++) incrementTasbih();');
assert.equal(status(), 'Alhamdulillah: 32 of 33', 'below the target the status should stay short');
assert.deepEqual(vibrations, [], 'vibration should wait for the target');

run('incrementTasbih();');
assert.equal(status(), 'Alhamdulillah: 33 of 33. Target of 33 reached.', 'reaching the target should name the dhikr and target');
assert.deepEqual(vibrations, [200], 'reaching the target should vibrate once when supported');

run('incrementTasbih();');
assert.equal(run('tasbihCount'), 34, 'the counter should keep counting after the target');
assert.equal(status(), 'Alhamdulillah: 34 of 33', 'the target message should only be announced once');
assert.deepEqual(vibrations, [200], 'vibration should not repeat past the target');

run('setTasbihTarget(99); resetTasbih(); for (let i = 0; i < 99; i++) incrementTasbih();');
assert.equal(status(), 'Alhamdulillah: 99 of 99. Target of 99 reached.', 'the message should reflect the selected target');

const noVibrate = createContext({});
assert.doesNotThrow(() => vm.runInContext('resetTasbih(); for (let i = 0; i < 33; i++) incrementTasbih();', noVibrate), 'vibration should stay optional');
assert.match(status(), /Target of 33 reached\.$/u, 'the target message should not depend on vibration support');

console.log('Tasbih target announcement tests passed');
