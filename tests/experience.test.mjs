import test from 'node:test';
import assert from 'node:assert/strict';

import { completeAction, initialStore, occurrence, STORAGE_KEY } from '../src/model.ts';
import {
  initialDemoStore,
  modeFromSearch,
  refillDemoStore,
  skipDemoTimer,
} from '../src/experience.ts';
import { DEMO_STORAGE_KEY, createStoreRepository } from '../src/storage.ts';

const DAY = '2026-09-05';

class MemoryStorage {
  constructor(entries = {}) { this.data = new Map(Object.entries(entries)); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  bytes() { return JSON.stringify([...this.data.entries()]); }
}

function banks() {
  return { local: new MemoryStorage(), session: new MemoryStorage() };
}

test('modeFromSearch only recognizes the exact demo=1 flag', () => {
  assert.equal(modeFromSearch('?demo=1'), 'demo');
  assert.equal(modeFromSearch('?foo=1&demo=1'), 'demo');
  for (const search of ['', '?demo=true', '?demo=0', '?demo=1x', '?Demo=1', '?demo=1&demo=0']) {
    assert.equal(modeFromSearch(search), 'personal');
  }
});

test('initialDemoStore is a self-contained teaching state with timer and split-task examples', () => {
  const store = initialDemoStore(DAY);
  assert.equal(store.glow, 1600);
  assert.ok(store.actions.some((action) => action.steps.length >= 2), 'demo includes a split task');
  assert.ok(store.actions.some((action) => action.minutes > 0), 'demo includes a timed task');
  assert.ok(store.templates.filter((template) => template.active).length >= 2);
  assert.ok(store.templates.filter((template) => template.rarity === 5 && template.active).length >= 2);
  assert.deepEqual(
    new Set(store.rewards.map((reward) => reward.status)),
    new Set(['pending', 'kept', 'released', 'redeemed']),
  );
  assert.ok(store.rewards.some((reward) => reward.rarity === 3));
  assert.ok(store.rewards.some((reward) => reward.rarity === 4));
  assert.ok(store.rewards.some((reward) => reward.rarity === 5));
});

test('refillDemoStore is demo-only, preserves progression, and adds demo material', () => {
  const original = initialDemoStore(DAY);
  const withProgress = { ...original, xp: 321, pity: { pullsSinceFive: 2, pullsSinceFourPlus: 3 } };
  const refilled = refillDemoStore(withProgress, 'demo', DAY);
  assert.equal(refilled.xp, 321);
  assert.deepEqual(refilled.pity, withProgress.pity);
  assert.ok(refilled.glow >= withProgress.glow);
  assert.ok(refilled.actions.length >= withProgress.actions.length);
  assert.throws(() => refillDemoStore(withProgress, 'personal', DAY), /demo|演示|体验/i);
});

test('skipDemoTimer only skips an active demo timer and does not award free XP', () => {
  const original = initialDemoStore(DAY);
  const timed = original.actions.find((action) => action.minutes > 0);
  assert.ok(timed);
  const actionId = timed.id;
  const key = occurrence(timed, DAY);
  const started = { ...original, timers: { ...original.timers, [key]: Date.now() + 60_000 } };
  const beforeXp = started.xp;
  const skipped = skipDemoTimer(started, actionId, 'demo', DAY, Date.now());
  assert.equal(skipped.xp, beforeXp);
  assert.ok(skipped.timers[key] <= Date.now());
  assert.throws(() => skipDemoTimer(started, actionId, 'personal', DAY, Date.now()), /demo|演示|体验/i);
  assert.deepEqual(skipDemoTimer(skipped, actionId, 'demo', DAY, Date.now()), skipped);
  const completed = completeAction(skipped, actionId, DAY, Date.now(), 'demo');
  assert.equal(completed.xp, beforeXp + 24);
  assert.equal(completed.timers[key], undefined);
  assert.deepEqual(completeAction(completed, actionId, DAY, Date.now(), 'demo'), completed);
});

test('personal and demo repositories use separate storage banks and demo reloads persist in session', () => {
  const { local, session } = banks();
  const personal = createStoreRepository('personal', { local, session });
  const demo = createStoreRepository('demo', { local, session });
  personal.save({ ...initialStore(DAY), xp: 77 });
  demo.save(initialDemoStore(DAY));
  const localBytes = local.bytes();
  const sessionBytes = session.bytes();
  assert.equal(local.getItem(STORAGE_KEY) !== null, true);
  assert.equal(session.getItem(DEMO_STORAGE_KEY) !== null, true);
  assert.deepEqual(demo.load(), demo.load());
  assert.equal(local.bytes(), localBytes);
  assert.equal(session.bytes(), sessionBytes);
  assert.equal(demo.key, DEMO_STORAGE_KEY);
  assert.equal(personal.key, STORAGE_KEY);
});

test('repository reset only clears demo state, while personal reset is forbidden', () => {
  const { local, session } = banks();
  const personal = createStoreRepository('personal', { local, session });
  const demo = createStoreRepository('demo', { local, session });
  personal.save({ ...initialStore(DAY), xp: 88 });
  demo.save(initialDemoStore(DAY));
  const personalRaw = local.getItem(STORAGE_KEY);
  const reset = demo.reset();
  assert.equal(reset.version, 1);
  assert.equal(session.getItem(DEMO_STORAGE_KEY) !== null, true);
  assert.equal(local.getItem(STORAGE_KEY), personalRaw);
  assert.throws(() => personal.reset(), /reset|重置|删除|personal/i);
});

test('export includes mode metadata and the correct filename', () => {
  const { local, session } = banks();
  const personal = createStoreRepository('personal', { local, session });
  const demo = createStoreRepository('demo', { local, session });
  const personalExport = personal.export();
  const demoExport = demo.export();
  assert.match(personalExport.filename, /personal|paper-actions/i);
  assert.match(demoExport.filename, /demo/i);
  assert.equal(JSON.parse(personalExport.content).metadata.mode, 'personal');
  assert.equal(JSON.parse(demoExport.content).metadata.mode, 'demo');
  assert.deepEqual(JSON.parse(demoExport.content).data, demo.load());
});

test('personal load normalizes legacy trial without mutating raw data and preserves private history fields', () => {
  const { local, session } = banks();
  const personal = createStoreRepository('personal', { local, session });
  const legacy = { ...initialStore(DAY), trial: true, glow: 42, pity: { pullsSinceFive: 6, pullsSinceFourPlus: 2 }, completions: [{ id: 'c', actionId: 'seed-1', day: DAY, title: 'x', eligible: true, used: false }] };
  const raw = JSON.stringify(legacy);
  local.setItem(STORAGE_KEY, raw);
  const loaded = personal.load();
  assert.equal(loaded.trial, false);
  assert.equal(loaded.glow, 42);
  assert.deepEqual(loaded.pity, legacy.pity);
  assert.deepEqual(loaded.completions, legacy.completions);
  assert.equal(local.getItem(STORAGE_KEY), raw);
});

test('corrupt personal data throws and stays untouched; corrupt demo data recovers its own sample', () => {
  const { local, session } = banks();
  const personal = createStoreRepository('personal', { local, session });
  const demo = createStoreRepository('demo', { local, session });
  local.setItem(STORAGE_KEY, '{broken');
  session.setItem(DEMO_STORAGE_KEY, '{broken');
  assert.throws(() => personal.load());
  assert.equal(local.getItem(STORAGE_KEY), '{broken');
  const recovered = demo.load();
  assert.equal(recovered.glow, 1600);
  assert.notEqual(session.getItem(DEMO_STORAGE_KEY), '{broken');
  assert.equal(local.getItem(STORAGE_KEY), '{broken');
});
