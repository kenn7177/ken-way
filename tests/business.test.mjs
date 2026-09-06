import test from 'node:test';
import assert from 'node:assert/strict';

import {
  completeAction,
  decideReward,
  drawReward,
  exchangeReward,
  initialStore,
  redeemReward,
  saveBudget,
  activateWish,
  saveTemplate,
  tossCoin,
} from '../src/model.ts';
import {
  FOUR_PLUS_HARD_PULL,
  FIVE_STAR_HARD_PULL,
  resolveRarity,
} from '../src/engine.ts';

const TODAY = '2026-09-05';
const NOW = 1_000_000;

function action(overrides = {}) {
  return {
    id: 'test-action',
    title: '测试行动',
    minimum: '做到最小一步',
    group: '生活',
    kind: 'habit',
    due: TODAY,
    priority: '普通',
    minutes: 0,
    steps: [],
    created: '2026-09-01',
    archived: false,
    ...overrides,
  };
}

function storeWith(overrides = {}) {
  return { ...initialStore(TODAY), ...overrides };
}

function withAction(overrides = {}, overridesStore = {}) {
  const entry = action(overrides);
  return {
    store: storeWith({ actions: [entry], ...overridesStore }),
    entry,
  };
}

test('completing an action is idempotent and awards exactly 24 XP once', () => {
  const { store } = withAction();
  const completed = completeAction(store, 'test-action', TODAY, NOW);
  const repeated = completeAction(completed, 'test-action', TODAY, NOW);

  assert.equal(completed.completions.length, 1);
  assert.equal(completed.completions[0].eligible, true);
  assert.equal(completed.xp, 24);
  assert.deepEqual(repeated, completed);
});

test('drawing the same completion twice creates only one reward and does not advance pity twice', () => {
  const { store } = withAction();
  const completed = completeAction(store, 'test-action', TODAY, NOW);
  const drawn = drawReward(completed, completed.completions[0].id, TODAY, 9999, 0);
  const repeated = drawReward(drawn, completed.completions[0].id, TODAY, 0, 0);

  assert.equal(drawn.rewards.length, 1);
  assert.deepEqual(repeated, drawn);
});

test('step-gated actions cannot be completed until every parent step is done', () => {
  const steps = ['第一步', '第二步'];
  const { store } = withAction({ steps });

  assert.throws(
    () => completeAction(store, 'test-action', TODAY, NOW),
    /先完成下面的小步骤/,
  );

  const ready = storeWith({
    actions: [action({ steps })],
    steps: { [`test-action:${TODAY}`]: [0, 1] },
  });
  assert.equal(completeAction(ready, 'test-action', TODAY, NOW).completions.length, 1);
});

test('timed actions are eligible only after their timer has ended', () => {
  const { store } = withAction({ minutes: 10 }, {},);
  const timed = storeWith({
    actions: [action({ minutes: 10 })],
    timers: { [`test-action:${TODAY}`]: NOW + 1 },
  });
  assert.throws(
    () => completeAction(timed, 'test-action', TODAY, NOW),
    /计时还没有结束/,
  );
  const ended = completeAction(
    { ...timed, timers: { [`test-action:${TODAY}`]: NOW } },
    'test-action',
    TODAY,
    NOW,
  );
  assert.equal(ended.completions.length, 1);
  assert.equal(ended.timers[`test-action:${TODAY}`], undefined);
});

test('an action created today records progress but gets no formal-mode grant', () => {
  const { store } = withAction({ created: TODAY });
  const next = completeAction(store, 'test-action', TODAY, NOW);
  assert.equal(next.completions[0].eligible, false);
  assert.throws(() => drawReward(next, next.completions[0].id, TODAY, 9999, 0), /今天的有效资格/);
});

test('formal mode grants at most five draws per day while still recording later actions', () => {
  let store = storeWith({ actions: Array.from({ length: 6 }, (_, i) => action({ id: `a-${i}`, title: `行动${i}` })) });
  for (let i = 0; i < 6; i += 1) store = completeAction(store, `a-${i}`, TODAY, NOW);
  assert.equal(store.completions.length, 6);
  assert.deepEqual(
    store.completions.map((completion) => completion.eligible).sort(),
    [false, true, true, true, true, true],
  );
  for (const completion of store.completions.filter((entry) => entry.eligible)) {
    store = drawReward(store, completion.id, TODAY, 9999, 0);
  }
  assert.equal(store.rewards.length, 5);
  assert.throws(
    () => drawReward(store, store.completions.find((entry) => !entry.eligible)?.id ?? 'missing', TODAY, 9999, 0),
    /有效资格/,
  );
});

test('explicit demo mode grants today-created actions and bypasses the five-draw cap', () => {
  let store = storeWith({ trial: true, actions: Array.from({ length: 6 }, (_, i) => action({ id: `trial-${i}`, created: TODAY })) });
  for (let i = 0; i < 6; i += 1) store = completeAction(store, `trial-${i}`, TODAY, NOW, 'demo');
  assert.equal(store.completions.every((completion) => completion.eligible), true);
  for (const completion of store.completions) store = drawReward(store, completion.id, TODAY, 9999, 0, 'demo');
  assert.equal(store.rewards.length, 6);
});

test('legacy trial=true does not grant normal-mode bypass', () => {
  let store = storeWith({ trial: true, actions: Array.from({ length: 6 }, (_, i) => action({ id: `legacy-${i}`, created: TODAY })) });
  for (let i = 0; i < 6; i += 1) store = completeAction(store, `legacy-${i}`, TODAY, NOW);
  assert.equal(store.completions.every((completion) => completion.eligible === false), true);
});

test('budget accepts only valid two-decimal amounts and keeps the old store on rejection', () => {
  const store = storeWith({ budget: 800 });
  for (const amount of [-1, Number.NaN, 1.001, 600]) {
    const before = structuredClone(store);
    if (amount === 600) {
      assert.equal(saveBudget(store, amount).budget, amount);
    } else {
      assert.throws(() => saveBudget(store, amount));
      assert.deepEqual(store, before);
    }
  }
});

test('wish activation requires an active five-star template within the budget', () => {
  const store = storeWith({ budget: 100 });
  assert.throws(() => activateWish(store, 'wish-1'), /预算|费用/);
  const inactive = { ...store, templates: store.templates.map((template) => template.id === 'wish-1' ? { ...template, active: false } : template) };
  assert.throws(() => activateWish(inactive, 'wish-1'));
  const valid = activateWish(storeWith({ budget: 600 }), 'wish-1');
  assert.equal(valid.wishId, 'wish-1');
});

test('existing template rarity is immutable and active wish edits stay within budget', () => {
  const store = storeWith({ budget: 100 });
  const four = store.templates.find((template) => template.id === 'four-1');
  assert.throws(() => saveTemplate(store, { ...four, rarity: 5 }), /星级|稀有/);
  const wish = store.templates.find((template) => template.id === 'wish-1');
  const before = structuredClone(store);
  assert.throws(() => saveTemplate(store, { ...wish, cost: 101 }), /预算|费用/);
  assert.deepEqual(store, before);
});

test('a grant from a previous day expires and cannot be drawn today', () => {
  const yesterday = '2026-09-04';
  const { store } = withAction({ created: '2026-09-01' });
  const recorded = completeAction(store, 'test-action', yesterday, NOW);
  assert.equal(recorded.completions[0].eligible, true);
  assert.throws(
    () => drawReward(recorded, recorded.completions[0].id, TODAY, 9999, 0),
    /今天的有效资格/,
  );
});

test('four-plus and five-star hard pity force their promised outcomes', () => {
  const four = resolveRarity({ pullsSinceFourPlus: FOUR_PLUS_HARD_PULL - 1, pullsSinceFive: 0 }, 9999);
  assert.equal(four.rarity, 4);
  assert.equal(four.cause, 'four_hard');

  const five = resolveRarity({ pullsSinceFourPlus: 0, pullsSinceFive: FIVE_STAR_HARD_PULL - 1 }, 9999);
  assert.equal(five.rarity, 5);
  assert.equal(five.cause, 'five_hard');
  assert.deepEqual(five.pityAfter, { pullsSinceFourPlus: 0, pullsSinceFive: 0 });
});

test('coin tossing stops at two tosses, and the final decision does not depend on coin result', () => {
  const { store } = withAction();
  let next = completeAction(store, 'test-action', TODAY, NOW);
  next = drawReward(next, next.completions[0].id, TODAY, 9999, 0);
  const rewardId = next.rewards[0].id;
  next = tossCoin(next, rewardId, 'heads');
  next = tossCoin(next, rewardId, 'tails');
  const third = tossCoin(next, rewardId, 'heads');
  assert.deepEqual(third.rewards[0].coins, ['heads', 'tails']);
  const kept = decideReward(third, rewardId, 'kept');
  assert.equal(kept.rewards[0].status, 'kept');
});

test('exchanging 800 glow creates a kept four-star reward without changing pity', () => {
  const pity = { pullsSinceFourPlus: 3, pullsSinceFive: 17 };
  const store = storeWith({ glow: 800, pity });
  const next = exchangeReward(store, 'four-1', TODAY);
  assert.equal(next.glow, 0);
  assert.equal(next.rewards[0].rarity, 4);
  assert.equal(next.rewards[0].status, 'kept');
  assert.deepEqual(next.pity, pity);
});

test('redeeming a kept reward is idempotent', () => {
  const { store } = withAction();
  let next = completeAction(store, 'test-action', TODAY, NOW);
  next = drawReward(next, next.completions[0].id, TODAY, 9999, 0);
  next = decideReward(next, next.rewards[0].id, 'kept');
  const redeemed = redeemReward(next, next.rewards[0].id);
  assert.equal(redeemed.rewards[0].status, 'redeemed');
  assert.deepEqual(redeemReward(redeemed, next.rewards[0].id), redeemed);
});
