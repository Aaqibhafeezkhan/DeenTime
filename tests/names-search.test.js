const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const functionSource = fs.readFileSync('script-core.js', 'utf8').match(/function renderNamesOfAllah\(\) \{[\s\S]*?\n\}/u);
assert.ok(functionSource, 'renderNamesOfAllah is missing from script-core.js');

const rendered = [];
function createElement() {
    const element = {
        className: '',
        textContent: '',
        children: [],
        append(...children) { element.children.push(...children); },
        addEventListener() {},
        setAttribute() {}
    };
    return element;
}

const elements = {
    namesList: { set innerHTML(value) { rendered.length = 0; }, appendChild(element) { rendered.push(element); } },
    namesSearch: { value: '' },
    namesResultCount: { textContent: '' },
    namesEmptyState: { classList: { toggle() {} }, textContent: '' }
};

const context = { document: { getElementById: id => elements[id] ?? null, createElement } };
vm.createContext(context);
vm.runInContext(fs.readFileSync('names-of-allah.js', 'utf8'), context);
vm.runInContext(functionSource[0], context);

const search = value => {
    elements.namesSearch.value = value;
    vm.runInContext('renderNamesOfAllah()', context);
    return rendered.map(button => button.children[2].textContent);
};

assert.deepEqual(search('ar-rahman'), ['Ar-Rahman'], 'lowercase search should match');
assert.deepEqual(search('AR-RAHMAN'), ['Ar-Rahman'], 'uppercase search should match');
assert.deepEqual(search('Ar-Raḥmān'), ['Ar-Rahman'], 'precomposed diacritics should be ignored');
assert.deepEqual(search('Ar-Raḥmān'), ['Ar-Rahman'], 'combining diacritics should be ignored');
assert.deepEqual(search('al-quddūs'), ['Al-Quddus'], 'macrons should be ignored');
assert.deepEqual(search('Al-Azīz'), ['Al-Aziz'], 'diacritic search should find the plain transliteration');
assert.ok(search('Mérciful').includes('Ar-Rahim'), 'meanings should match without diacritics');
assert.deepEqual(search('الرَّحْمَٰنُ'), ['Ar-Rahman'], 'Arabic search should ignore harakat');
assert.deepEqual(search('الرحيم'), ['Ar-Rahim'], 'plain Arabic search should still match');

search('Ar-Raḥmān');
const [card] = rendered;
assert.equal(card.children[1].textContent, 'الرحمن', 'Arabic display text should not change');
assert.equal(card.children[2].textContent, 'Ar-Rahman', 'transliterated display text should not change');
assert.equal(elements.namesResultCount.textContent, '1 of 99 names shown', 'result count should reflect diacritic matches');

console.log('Names search normalization tests passed');
