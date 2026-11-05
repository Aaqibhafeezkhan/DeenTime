const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('script-core.js', 'utf8');
const extract = name => {
    const match = source.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`, 'u'));
    assert.ok(match, `${name} is missing from script-core.js`);
    return match[0];
};

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

function createContext(dialog) {
    const text = () => ({ textContent: '' });
    const closeButton = { focused: false, focus() { closeButton.focused = true; }, addEventListener() {} };
    const elements = {
        nameDetailDialog: dialog,
        nameDetailNumber: text(),
        nameDetailArabic: text(),
        nameDetailEnglish: text(),
        nameDetailMeaning: text(),
        closeNameDialog: closeButton
    };
    const context = { document: { getElementById: id => elements[id] ?? null } };
    vm.createContext(context);
    vm.runInContext(['openNameDetails', 'closeNameDetails', 'handleNameDialogKeydown', 'setupNameDialog'].map(extract).join('\n'), context);
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
    const open = () => vm.runInContext('openNameDetails(name)', Object.assign(context, { name }));

    assert.equal(dialog.listeners.filter(entry => entry.type === 'keydown').length, 1, `${label}: setup should add one keydown listener`);

    open();
    assert.equal(dialog.isVisible(), true, `${label}: opening should show the dialog`);
    if (!native) assert.equal(closeButton.focused, true, 'fallback dialog: opening should move focus into the dialog');

    const other = pressKey(dialog, 'Enter');
    assert.equal(dialog.isVisible(), true, `${label}: other keys should not close the dialog`);
    assert.equal(other.defaultPrevented, false, `${label}: other keys should keep their default behavior`);

    const escape = pressKey(dialog, 'Escape');
    assert.equal(dialog.isVisible(), false, `${label}: Escape should close the dialog`);
    assert.equal(escape.defaultPrevented, true, `${label}: Escape should be handled once`);

    for (let cycle = 0; cycle < 3; cycle++) {
        open();
        vm.runInContext('closeNameDetails()', context);
        assert.equal(dialog.isVisible(), false, `${label}: the close button path should still close the dialog`);
    }
    assert.equal(dialog.listeners.length, 1, `${label}: repeated open/close cycles should not add listeners`);

    open();
    pressKey(dialog, 'Escape');
    assert.equal(dialog.isVisible(), false, `${label}: Escape should still close after repeated cycles`);
}

console.log('Names detail dialog tests passed');
