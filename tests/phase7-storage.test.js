const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'phase7.js'), 'utf8');

const listeners = {};
const elements = {};

function createElement(id) {
    return {
        id,
        textContent: '',
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        classList: { toggle() {} },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        appendChild(element) {
            this.child = element;
            elements[element.id] = element;
        }
    };
}

const countElement = createElement('tasbihCount');
const panelContent = createElement('panelContent');
const targetButtons = ['33', '99', '100'].map(text => createElement(text));
const dhikrButtons = ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar'].map(text => createElement(text));
targetButtons.forEach(button => { button.textContent = button.id; });
dhikrButtons.forEach(button => { button.textContent = button.id; });

const panel = {
    querySelector(selector) {
        return selector === '.text-center' ? panelContent : null;
    },
    querySelectorAll(selector) {
        if (selector === '.tasbih-target') return targetButtons;
        if (selector === '.dhikr-btn') return dhikrButtons;
        return [];
    }
};

elements.tasbihPanel = panel;
elements.tasbihCount = countElement;

const context = {
    console,
    navigator: {},
    userSettings: { tasbihTarget: 33, currentDhikr: 'SubhanAllah' },
    saveSettings() {},
    document: {
        addEventListener(type, listener) { listeners[type] = listener; },
        getElementById(id) { return elements[id] || null; },
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
assert.equal(countElement.textContent, '0', 'Initialization should apply the fallback Tasbih state');
assert.equal(elements.tasbihStatus.textContent, 'SubhanAllah: 0 of 33', 'Initialization should read and apply the fallback state');
assert.equal(panelContent.child, elements.tasbihStatus, 'Initialization should attach the status element to the Tasbih panel');

vm.runInContext('incrementTasbih(); incrementTasbih(); setTasbihTarget(99);', context);
assert.equal(vm.runInContext('tasbihCount', context), 2, 'Tasbih count should advance in memory when storage writes throw');
assert.equal(countElement.textContent, '2', 'Tasbih display should show the in-memory count when storage writes throw');
assert.equal(context.userSettings.tasbihTarget, 99, 'Tasbih target should change in memory when storage writes throw');
assert.equal(elements.tasbihStatus.textContent, 'SubhanAllah: 2 of 99', 'The status should reflect count and target changes');

vm.runInContext('resetTasbih();', context);
assert.equal(vm.runInContext('tasbihCount', context), 0, 'Tasbih reset should work when storage writes throw');
assert.equal(countElement.textContent, '0', 'Tasbih display should reset when storage writes throw');

console.log('Phase 7 Tasbih storage failure tests passed');
