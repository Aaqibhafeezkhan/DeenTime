const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const phase6 = fs.readFileSync('phase6.js', 'utf8');
const scriptCore = fs.readFileSync('script-core.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

const extract = (source, name) => {
    const match = source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n\\}`, 'u'));
    assert.ok(match, `${name} is missing`);
    return match[0];
};

// Markup and styles that the calendar's grid semantics depend on.
assert.match(html, /<div id="calendarGrid"[^>]*\brole="grid"/u, 'the calendar container should be a grid');
assert.match(html, /<div id="calendarGrid"[^>]*\baria-labelledby="calendarMonth"/u, 'the grid should be named by the month heading');
assert.match(
    css,
    /#calendarGrid \[role="row"\]\s*\{[^}]*display:\s*grid;[^}]*grid-column:\s*1\s*\/\s*-1;[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\);/u,
    'week rows should remain layout boxes spanning the seven calendar columns'
);

// A fixed clock keeps the test independent of the real date: today is 15 January 2026.
const FIXED_NOW = Date.UTC(2026, 0, 15, 12);
const RealDate = Date;
class FixedDate extends RealDate {
    constructor(...args) {
        if (args.length === 0) super(FIXED_NOW);
        else super(...args);
    }
    static now() {
        return FIXED_NOW;
    }
}

const matches = (node, selector) => {
    assert.ok(selector.startsWith('.'), `unsupported selector ${selector}`);
    return node.className.split(/\s+/u).includes(selector.slice(1));
};

// Minimal DOM: enough tree, attribute, focus and event behaviour for renderCalendar() and its key handler.
const createElement = () => {
    const element = {
        children: [],
        attributes: {},
        dataset: {},
        className: '',
        textContent: '',
        tabIndex: 0,
        parent: null,
        listeners: {},
        _html: '',
        setAttribute(name, value) { this.attributes[name] = String(value); },
        getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; },
        appendChild(child) {
            child.parent = this;
            this.children.push(child);
            return child;
        },
        addEventListener(type, listener) { this.listeners[type] = listener; },
        focus() { doc.activeElement = this; },
        closest(selector) {
            for (let node = this; node; node = node.parent) {
                if (matches(node, selector)) return node;
            }
            return null;
        },
        querySelectorAll(selector) {
            const found = [];
            const walk = (node) => node.children.forEach((child) => {
                if (matches(child, selector)) found.push(child);
                walk(child);
            });
            walk(this);
            return found;
        },
        set innerHTML(value) {
            this._html = value;
            if (value === '') {
                // Clearing the grid removes the focused cell, so focus is lost as in a browser.
                doc.activeElement = null;
                this.children.forEach((child) => { child.parent = null; });
                this.children = [];
            }
        },
        get innerHTML() { return this._html; }
    };
    return element;
};

const elements = { calendarGrid: createElement(), calendarMonth: createElement() };
const doc = {
    activeElement: null,
    getElementById: (id) => elements[id] || null,
    createElement
};

const context = {
    document: doc,
    Date: FixedDate,
    userSettings: { timeZone: 'UTC' },
    calendarOffset: 0
};
vm.createContext(context);
// Load the real production functions: time helpers from script-core.js, calendar code from phase6.js.
vm.runInContext(
    [
        extract(scriptCore, 'getTimeZoneOffsetHours'),
        extract(scriptCore, 'getTimeZoneDateParts'),
        extract(scriptCore, 'zonedTimeToDate'),
        phase6,
        'this.getCalendarKeyTarget = getCalendarKeyTarget;'
    ].join('\n'),
    context
);

const grid = elements.calendarGrid;
const gridCells = () => grid.querySelectorAll('.calendar-day');
const tabStops = () => gridCells().filter((cell) => cell.tabIndex === 0);
const focused = () => {
    const cell = doc.activeElement;
    assert.ok(cell && matches(cell, '.calendar-day'), 'focus should be on a day cell');
    return { month: Number(cell.dataset.month), day: Number(cell.dataset.day), label: cell.attributes['aria-label'] };
};
const press = (key) => {
    let prevented = false;
    grid.listeners.keydown({
        key,
        target: tabStops()[0],
        preventDefault() { prevented = true; }
    });
    return prevented;
};

// Pure key-target calculation, including leap years and non-navigation keys.
const target = (...args) => JSON.parse(JSON.stringify(context.getCalendarKeyTarget(...args)));
assert.deepEqual(target(2026, 0, 31, 'ArrowRight'), { year: 2026, month: 1, day: 1, monthDelta: 1 });
assert.deepEqual(target(2026, 2, 1, 'ArrowLeft'), { year: 2026, month: 1, day: 28, monthDelta: -1 });
assert.deepEqual(target(2026, 1, 25, 'ArrowDown'), { year: 2026, month: 2, day: 4, monthDelta: 1 });
assert.deepEqual(target(2026, 0, 3, 'ArrowUp'), { year: 2025, month: 11, day: 27, monthDelta: -1 });
assert.deepEqual(target(2024, 2, 1, 'ArrowLeft'), { year: 2024, month: 1, day: 29, monthDelta: -1 });
assert.deepEqual(target(2026, 0, 15, 'ArrowRight'), { year: 2026, month: 0, day: 16, monthDelta: 0 });
assert.equal(target(2026, 0, 15, 'Enter'), null);
assert.equal(target(2026, 0, 15, 'Tab'), null);

// Rendered output from the real renderCalendar(): January 2026 starts on a Thursday.
context.renderCalendar();
assert.match(elements.calendarMonth.textContent, /^January 2026 · /u);

const rows = grid.children;
assert.equal(rows.length, 6, 'header row plus five week rows');
rows.forEach((row) => assert.equal(row.getAttribute('role'), 'row', 'every week container should be a row'));

const headerCells = rows[0].children;
assert.deepEqual(headerCells.map((cell) => cell.getAttribute('role')), Array(7).fill('columnheader'));
assert.deepEqual(headerCells.map((cell) => cell.getAttribute('aria-label')), [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
]);

const firstWeek = rows[1].children;
assert.equal(firstWeek.filter((cell) => cell.getAttribute('aria-hidden') === 'true').length, 4, 'four leading blanks before 1 January');
assert.equal(rows[5].children.length, 7, 'the last full week is complete');

const cells = gridCells();
assert.equal(cells.length, 31);
cells.forEach((cell) => assert.equal(cell.getAttribute('role'), 'gridcell', 'day cells should be gridcells'));
assert.ok(
    !grid.querySelectorAll('.calendar-day').some((cell) => cell.getAttribute('role') === 'button'),
    'day cells must not be buttons'
);

const today = cells.find((cell) => cell.dataset.day === '15');
assert.match(today.attributes['aria-label'], /^Thursday, January 15, 2026, /u, 'the date should be announced with weekday and month');
assert.deepEqual(tabStops().map((cell) => cell.dataset.day), ['15'], 'roving tabindex starts on today');

// Arrow keys move real focus between cells in the same month.
assert.equal(press('ArrowRight'), true);
assert.deepEqual(focused().day, 16);
assert.equal(focused().label.startsWith('Friday, January 16, 2026, '), true, 'the newly focused date should be announced');
assert.equal(tabStops().length, 1, 'roving tabindex keeps one tab stop after moving');
assert.equal(tabStops()[0].dataset.day, '16');

// Moving past the end of January switches to February and focuses the matching day.
assert.equal(press('ArrowDown'), true);
assert.equal(press('ArrowDown'), true);
assert.deepEqual(focused().day, 30);
assert.equal(press('ArrowDown'), true);
assert.deepEqual({ month: focused().month, day: focused().day }, { month: 1, day: 6 });
assert.match(elements.calendarMonth.textContent, /^February 2026 · /u);
assert.equal(tabStops().length, 1);

// Previous/next month buttons call changeMonth(delta) with no day, so focus resets to the 1st.
context.changeMonth(1);
assert.match(elements.calendarMonth.textContent, /^March 2026 · /u);
assert.equal(tabStops().length, 1);
assert.deepEqual(
    { month: Number(tabStops()[0].dataset.month), day: Number(tabStops()[0].dataset.day) },
    { month: 2, day: 1 }
);

// Moving back over a month boundary lands on the last day of February 2026 (not a leap year).
tabStops()[0].focus();
assert.equal(press('ArrowLeft'), true);
assert.deepEqual({ month: focused().month, day: focused().day }, { month: 1, day: 28 });

// Non-navigation keys are left alone.
assert.equal(press('Enter'), false);
assert.deepEqual({ month: focused().month, day: focused().day }, { month: 1, day: 28 });

console.log('Calendar keyboard navigation tests passed');
