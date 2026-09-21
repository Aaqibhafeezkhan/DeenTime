const assert = require('node:assert/strict');

const phase7Targets = [33, 99, 100];

function createState(source = {}) {
    const target = phase7Targets.includes(Number(source.target)) ? Number(source.target) : 33;
    const count = Number.isInteger(Number(source.count)) && Number(source.count) >= 0 ? Number(source.count) : 0;
    const dhikr = typeof source.dhikr === 'string' && source.dhikr.trim() ? source.dhikr : 'SubhanAllah';
    return { count, target, dhikr };
}

function reduce(state, action) {
    const current = createState(state);
    if (action.type === 'increment') return { ...current, count: current.count + 1 };
    if (action.type === 'reset') return { ...current, count: 0 };
    if (action.type === 'target' && phase7Targets.includes(Number(action.value))) return { ...current, target: Number(action.value) };
    if (action.type === 'dhikr' && typeof action.value === 'string' && action.value.trim()) return { ...current, dhikr: action.value };
    return current;
}

let state = createState({ count: 32, target: 33, dhikr: 'SubhanAllah' });
state = reduce(state, { type: 'increment' });
assert.deepEqual(state, { count: 33, target: 33, dhikr: 'SubhanAllah' });

state = reduce(state, { type: 'target', value: 99 });
assert.equal(state.target, 99);
assert.equal(state.count, 33);

state = reduce(state, { type: 'dhikr', value: 'Alhamdulillah' });
assert.equal(state.dhikr, 'Alhamdulillah');

state = reduce(state, { type: 'reset' });
assert.deepEqual(state, { count: 0, target: 99, dhikr: 'Alhamdulillah' });

assert.deepEqual(createState({ count: -1, target: 42, dhikr: '' }), { count: 0, target: 33, dhikr: 'SubhanAllah' });
assert.deepEqual(reduce(state, { type: 'target', value: 42 }), state);
assert.deepEqual(reduce(state, { type: 'dhikr', value: '' }), state);

console.log('Phase 7 Tasbih state tests passed');
