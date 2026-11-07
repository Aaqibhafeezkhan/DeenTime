const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('phase6.js', 'utf8');
const extract = (name) => {
    const match = source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`, 'u'));
    assert.ok(match, `${name} is missing from phase6.js`);
    return match[0];
};

const fakeGrid = { cells: [], querySelectorAll() { return this.cells; } };

// Minimal stand-in for renderCalendar(): builds day cells for the month at calendarOffset,
// using the same focus rule as phase6.js (remembered day, clamped to the month length).
const context = {
    calendarOffset: 0,
    document: { getElementById: (id) => (id === 'calendarGrid' ? fakeGrid : null) },
    renderCalendar() {
        const first = new Date(Date.UTC(2026, context.calendarOffset, 1));
        const year = first.getUTCFullYear();
        const month = first.getUTCMonth();
        const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const focusDay = Math.min(vm.runInContext('calendarFocusDay', context) || 1, days);
        fakeGrid.cells = Array.from({ length: days }, (_, i) => makeCell(year, month, i + 1, focusDay));
    }
};
vm.createContext(context);
vm.runInContext(
    [
        'let calendarFocusDay = null;',
        extract('getCalendarKeyTarget'),
        extract('focusCalendarDay'),
        extract('handleCalendarKeydown'),
        extract('changeMonth'),
        'this.getCalendarKeyTarget = getCalendarKeyTarget;'
    ].join('\n'),
    context
);

function makeCell(year, month, day, focusDay) {
    return {
        dataset: { year: String(year), month: String(month), day: String(day) },
        tabIndex: day === focusDay ? 0 : -1,
        focused: false,
        closest() { return this; },
        focus() {
            fakeGrid.cells.forEach((cell) => { cell.focused = false; });
            this.focused = true;
        }
    };
}

// Round-trip through JSON so results from the vm context compare by value.
const target = (...args) => JSON.parse(JSON.stringify(context.getCalendarKeyTarget(...args)));

// Month-boundary moves cross into the neighbouring month and report the month delta.
assert.deepEqual(target(2026, 0, 31, 'ArrowRight'), { year: 2026, month: 1, day: 1, monthDelta: 1 });
assert.deepEqual(target(2026, 2, 1, 'ArrowLeft'), { year: 2026, month: 1, day: 28, monthDelta: -1 });
assert.deepEqual(target(2026, 1, 25, 'ArrowDown'), { year: 2026, month: 2, day: 4, monthDelta: 1 });
assert.deepEqual(target(2026, 0, 3, 'ArrowUp'), { year: 2025, month: 11, day: 27, monthDelta: -1 });

// Leap years are respected at the month boundary.
assert.deepEqual(target(2024, 2, 1, 'ArrowLeft'), { year: 2024, month: 1, day: 29, monthDelta: -1 });

// Moves inside a month keep the delta at zero.
assert.deepEqual(target(2026, 0, 15, 'ArrowRight'), { year: 2026, month: 0, day: 16, monthDelta: 0 });
assert.deepEqual(target(2026, 0, 15, 'ArrowUp'), { year: 2026, month: 0, day: 8, monthDelta: 0 });

// Other keys are not calendar navigation.
assert.equal(target(2026, 0, 15, 'Enter'), null);
assert.equal(target(2026, 0, 15, 'Tab'), null);

assert.match(source, /cell\.tabIndex = day === focusDay \? 0 : -1;/u, 'only the focused day should be in the tab order');
assert.match(source, /grid\.addEventListener\('keydown', handleCalendarKeydown\);/u, 'the grid should handle arrow keys');

// Behaviour against a fake grid: arrow keys move focus, month boundaries change month, and
// month-button navigation does not keep a day remembered from keyboard navigation.
const press = (key) => {
    const cell = fakeGrid.cells.find((c) => c.tabIndex === 0);
    let prevented = false;
    context.handleCalendarKeydown({ key, target: cell, preventDefault() { prevented = true; } });
    return prevented;
};
const focused = () => {
    const cells = fakeGrid.cells.filter((c) => c.focused);
    assert.equal(cells.length, 1, 'exactly one day cell should hold focus');
    return { month: Number(cells[0].dataset.month), day: Number(cells[0].dataset.day) };
};
const tabStops = () => fakeGrid.cells.filter((c) => c.tabIndex === 0).length;

context.renderCalendar();
assert.equal(tabStops(), 1, 'exactly one day should be in the tab order');
assert.equal(fakeGrid.cells.find((c) => c.tabIndex === 0).dataset.day, '1');

assert.equal(press('ArrowRight'), true);
assert.deepEqual(focused(), { month: 0, day: 2 });
assert.equal(tabStops(), 1, 'roving tabindex keeps one tab stop after moving');

// Previous/next month buttons call changeMonth(delta) with no day: focus must not keep day 2.
context.changeMonth(1);
assert.equal(fakeGrid.cells[0].dataset.month, '1');
assert.equal(fakeGrid.cells.find((c) => c.tabIndex === 0).dataset.day, '1');
assert.equal(tabStops(), 1);
fakeGrid.cells.find((c) => c.dataset.day === '1').focus();

// Crossing back over a month boundary lands on the adjacent month's last day.
assert.equal(press('ArrowLeft'), true);
assert.deepEqual(focused(), { month: 0, day: 31 });

// Moving forward across a boundary by a week.
assert.equal(press('ArrowDown'), true);
assert.deepEqual(focused(), { month: 1, day: 7 });

// Keys that are not navigation are left alone.
assert.equal(press('Enter'), false);
assert.deepEqual(focused(), { month: 1, day: 7 });

console.log('Calendar keyboard navigation tests passed');
