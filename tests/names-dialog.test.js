const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('script-core.js', 'utf8');
const extract = name => {
    const match = source.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`, 'u'));
    assert.ok(match, `${name} is missing from script-core.js`);
    return match[0];
};
const triggerState = source.match(/^let nameDialogTrigger = null;$/mu);
assert.ok(triggerState, 'nameDialogTrigger is missing from script-core.js');

function createDialog({ native }) {
    const listeners = [];
    const attributes = new Set(['hidden']);
    const dialog = {
        open: false,
        listeners,
        addEventListener(type, listener) { listeners.push({ type, listener }); },
        removeAttribute(name) { attributes.delete(name); },
        setAttribute(name) { attributes.add(name); },
        hasAttribute(name) { return attributes.has(name); },
        isVisible() { return native ? dialog.open : !attributes.has('hidden'); }
    };
    if (native) {
        dialog.showModal = () => { dialog.open = true; };
        dialog.close = () => { dialog.open = false; };
    }
    return dialog;
}

function createFocusable() {
    const element = {
        focusCount: 0,
        listeners: [],
        focus() { element.focusCount++; },
        addEventListener(type, listener) { element.listeners.push({ type, listener }); },
        click() { element.listeners.filter(entry => entry.type === 'click').forEach(entry => entry.listener()); }
    };
    return element;
}

function createContext(dialog) {
    const text = () => ({ textContent: '' });
    const closeButton = createFocusable();
    const elements = {
        nameDetailDialog: dialog,
        nameDetailNumber: text(),
        nameDetailArabic: text(),
        nameDetailEnglish: text(),
        nameDetailMeaning: text(),
        closeNameDialog: closeButton
    };
    const context = { document: { activeElement: null, getElementById: id => elements[id] ?? null } };
    vm.createContext(context);
    const functions = ['openNameDetails', 'closeNameDetails', 'handleNameDialogKeydown', 'setupNameDialog'].map(extract);
    vm.runInContext([triggerState[0], ...functions].join('\n'), context);
    vm.runInContext('setupNameDialog()', context);
    return { context, closeButton };
}

function pressKey(dialog, key) {
    const event = { key, defaultPrevented: false, preventDefault() { event.defaultPrevented = true; } };
    dialog.listeners.filter(entry => entry.type === 'keydown').forEach(entry => entry.listener(event));
    return event;
}

const name = { number: 1, ar: 'الرحمن', en: 'Ar-Rahman', meaning: 'The Beneficent' };

for (const native of [true, false]) {
    const label = native ? 'native dialog' : 'fallback dialog';
    const dialog = createDialog({ native });
    const { context, closeButton } = createContext(dialog);
    const nameButton = createFocusable();
    const open = () => vm.runInContext('openNameDetails(name, nameButton)', Object.assign(context, { name, nameButton }));
    // The native <dialog> restores focus itself; the fallback has to return it by hand.
    const expectedReturns = count => native ? 0 : count;

    assert.equal(dialog.listeners.filter(entry => entry.type === 'keydown').length, 1, `${label}: setup should add one keydown listener`);
    assert.equal(closeButton.listeners.filter(entry => entry.type === 'click').length, 1, `${label}: setup should add one close-button click listener`);

    open();
    assert.equal(dialog.isVisible(), true, `${label}: opening should show the dialog`);
    if (!native) assert.equal(closeButton.focusCount, 1, 'fallback dialog: opening should move focus into the dialog');

    const other = pressKey(dialog, 'Enter');
    assert.equal(dialog.isVisible(), true, `${label}: other keys should not close the dialog`);
    assert.equal(other.defaultPrevented, false, `${label}: other keys should keep their default behavior`);

    const escape = pressKey(dialog, 'Escape');
    assert.equal(dialog.isVisible(), false, `${label}: Escape should close the dialog`);
    assert.equal(escape.defaultPrevented, true, `${label}: Escape should be handled once`);
    assert.equal(nameButton.focusCount, expectedReturns(1), `${label}: Escape should return focus to the name button`);

    for (let cycle = 0; cycle < 3; cycle++) {
        open();
        closeButton.click();
        assert.equal(dialog.isVisible(), false, `${label}: clicking Close should close the dialog`);
        assert.equal(nameButton.focusCount, expectedReturns(cycle + 2), `${label}: clicking Close should return focus to the name button`);
    }
    assert.equal(dialog.listeners.length, 1, `${label}: repeated open/close cycles should not add listeners`);
    assert.equal(closeButton.listeners.length, 1, `${label}: repeated open/close cycles should not add close-button listeners`);

    open();
    pressKey(dialog, 'Escape');
    assert.equal(dialog.isVisible(), false, `${label}: Escape should still close after repeated cycles`);
}

console.log('Names detail dialog tests passed');
