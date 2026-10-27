const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /id="namesEmptyState"/u, 'Names empty-state element is missing from index.html');
assert.match(html, /<p id="namesEmptyState"[^>]*role="status"/u, 'Names empty-state message must be a live status region');

const functionSource = fs.readFileSync('script-core.js', 'utf8').match(/function renderNamesOfAllah\(\) \{[\s\S]*?\n\}/u);
assert.ok(functionSource, 'renderNamesOfAllah is missing from script-core.js');

function createClassList(initial) {
    const classes = new Set(initial);
    return {
        contains: name => classes.has(name),
        toggle(name, force) {
            const shouldAdd = force === undefined ? !classes.has(name) : Boolean(force);
            if (shouldAdd) classes.add(name);
            else classes.delete(name);
            return shouldAdd;
        }
    };
}

function createElement() {
    return {
        className: '',
        textContent: '',
        innerHTML: '',
        append() {},
        appendChild() {},
        addEventListener() {},
        setAttribute() {}
    };
}

const elements = {
    namesList: createElement(),
    namesSearch: { value: '' },
    namesResultCount: createElement(),
    namesEmptyState: { classList: createClassList(['hidden']) }
};

const context = {
    document: {
        getElementById: id => elements[id] ?? null,
        createElement
    }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('names-of-allah.js', 'utf8'), context);
vm.runInContext(functionSource[0], context);

const isEmptyStateVisible = () => !elements.namesEmptyState.classList.contains('hidden');
const search = value => {
    elements.namesSearch.value = value;
    vm.runInContext('renderNamesOfAllah()', context);
};

search('');
assert.equal(isEmptyStateVisible(), false, 'Empty search must not show the empty state');

search('zzz-no-such-name');
assert.equal(isEmptyStateVisible(), true, 'No-match search must show the empty state');

search('merciful');
assert.equal(isEmptyStateVisible(), false, 'Matching search must hide the empty state');

search('zzz-no-such-name');
assert.equal(isEmptyStateVisible(), true, 'No-match search must show the empty state again');

search('');
assert.equal(isEmptyStateVisible(), false, 'Cleared search must hide the empty state');

console.log('Names empty-state tests passed');
