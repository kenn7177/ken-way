import { completed, dayKey, dayOffset, id, initialStore, occurrence, type AppMode, type Reward, type Store } from './model.ts';

export function modeFromSearch(search: string): AppMode {
  const flags = new URLSearchParams(search).getAll('demo');
  return flags.length === 1 && flags[0] === '1' ? 'demo' : 'personal';
}

function examples(store: Store, day: string): Reward[] {
  return ([3, 4, 5] as const).map((rarity) => {
    const template = store.templates.find((item) => item.rarity === rarity && item.active && (rarity !== 5 || item.id === store.wishId));
    if (!template) throw new Error(`请先在奖励池中准备 ${rarity} 星奖励。`);
    return {
      id: id(), completionId: `demo-${id()}`, title: template.title,
      description: template.description, rarity, date: day, status: 'pending',
      coins: [], source: '体验示例 · 非实际抽取', isExample: true,
    };
  });
}

export function initialDemoStore(day = dayKey()): Store {
  const store = initialStore(day);
  store.actions[1].minutes = 1;
  store.actions[1].minimum = '体验一次专注计时；开始后可以跳过等待。';
  store.templates.push({ id: 'demo-wish-2', title: '听一场期待已久的音乐会', description: '给喜欢的音乐，留一个现场的位置。', rarity: 5, minutes: 120, cost: 300, active: true });
  store.glow = 1600;
  store.glowHistory = [{ id: id(), amount: 1600, source: '体验示例', date: day }];
  store.trial = false;
  const pending = examples(store, day);
  const previous = (reward: Reward, status: Reward['status']): Reward => ({ ...reward, id: id(), completionId: `demo-${id()}`, status, date: dayOffset(-1, day) });
  store.rewards = [...pending, previous(pending[0], 'kept'), previous(pending[1], 'kept'), previous(pending[0], 'redeemed'), previous(pending[1], 'released')];
  return store;
}

export function refillDemoStore(store: Store, mode: AppMode, day = dayKey()): Store {
  if (mode !== 'demo') throw new Error('示例补充只在体验模式中可用。');
  return {
    ...store,
    glow: store.glow + 1600,
    glowHistory: [{ id: id(), amount: 1600, source: '体验补充', date: day }, ...(store.glowHistory ?? [])],
    rewards: [...examples(store, day), ...store.rewards],
  };
}

export function skipDemoTimer(store: Store, actionId: string, mode: AppMode, day = dayKey(), now = Date.now()): Store {
  if (mode !== 'demo') throw new Error('跳过等待只在体验模式中可用。');
  const action = store.actions.find((item) => item.id === actionId && !item.archived);
  if (!action || action.minutes <= 0 || completed(store, action, day)) throw new Error('这条行动没有正在进行的计时。');
  const key = occurrence(action, day);
  if (!store.timers[key]) throw new Error('请先开始计时。');
  return { ...store, timers: { ...store.timers, [key]: Math.max(1, Math.min(store.timers[key], now)) } };
}
