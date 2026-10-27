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
        querySelector() { return null; },
        querySelectorAll() { return []; },
        appendChild() {}
    };
}

const listeners = {};
const countElement = createElement('tasbihCount');
const context = {
    console,
    navigator: {},
    userSettings: { tasbihTarget: 33, currentDhikr: 'SubhanAllah' },
    saveSettings() {},
    document: {
        addEventListener(type, listener) { listeners[type] = listener; },
        getElementById(id) { return id === 'tasbihCount' ? countElement : null; },
        querySelectorAll() { return []; },
        createElement(tag) { return createElement(tag); }
    },
    localStorage: {
        getItem() { throw new Error('localStorage is disabled'); },
        setItem() { throw new Error('localStorage is disabled'); }
    }
};

vm.createContext(context);
vm.runInContext('var tasbihCount = 0;', context);
vm.runInContext(source, context);

assert.doesNotThrow(() => listeners.DOMContentLoaded(), 'Tasbih initialization should not crash when localStorage throws');

vm.runInContext('incrementTasbih(); incrementTasbih(); setTasbihTarget(99);', context);
assert.equal(vm.runInContext('tasbihCount', context), 2, 'Tasbih count should advance in memory when storage writes throw');
assert.equal(countElement.textContent, '2', 'Tasbih display should show the in-memory count when storage writes throw');
assert.equal(context.userSettings.tasbihTarget, 99, 'Tasbih target should change in memory when storage writes throw');

vm.runInContext('resetTasbih();', context);
assert.equal(vm.runInContext('tasbihCount', context), 0, 'Tasbih reset should work when storage writes throw');

console.log('Phase 7 Tasbih storage failure tests passed');
