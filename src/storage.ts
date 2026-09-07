import { dayKey, initialStore, STORAGE_KEY, type AppMode, type Store } from './model.ts';
import { initialDemoStore } from './experience.ts';

export const DEMO_STORAGE_KEY = 'paper-actions:demo:v1';
export type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

function decodeStore(raw: string): Store {
  const data = JSON.parse(raw) as Store;
  const validNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  if (!data || data.version !== 1 || !Array.isArray(data.actions) || !Array.isArray(data.completions) || !Array.isArray(data.rewards) || !Array.isArray(data.templates) || !data.pity || !data.steps || !data.timers || !validNumber(data.xp) || !validNumber(data.glow) || !validNumber(data.budget) || !validNumber(data.pity.pullsSinceFive) || !validNumber(data.pity.pullsSinceFourPlus)) {
    throw new Error('本地记录无法读取，请先导出备份，原记录不会被覆盖。');
  }
  // Legacy trial data remains readable; only the explicit app mode can enable demo privileges.
  return { ...data, glowHistory: data.glowHistory ?? [], trial: false };
}

export function createStoreRepository(mode: AppMode, storage: { local: StoragePort; session: StoragePort }) {
  const bank = mode === 'demo' ? storage.session : storage.local;
  const key = mode === 'demo' ? DEMO_STORAGE_KEY : STORAGE_KEY;
  const save = (store: Store) => bank.setItem(key, JSON.stringify({ ...store, trial: false }));
  const load = (): Store => {
    const raw = bank.getItem(key);
    if (mode === 'personal') return raw ? decodeStore(raw) : initialStore();
    if (raw) {
      try { return decodeStore(raw); } catch { /* Only this session's demo may be regenerated. */ }
    }
    const initial = initialDemoStore();
    save(initial);
    return initial;
  };
  return {
    key, mode, load, save,
    export: () => ({
      filename: `paper-actions-${mode === 'demo' ? 'demo-' : ''}${dayKey()}.json`,
      content: JSON.stringify({ metadata: { mode, exportedAt: new Date().toISOString() }, data: load() }, null, 2),
    }),
    rawBackup: () => ({ filename: `paper-actions-${mode}-backup-${dayKey()}.json`, content: bank.getItem(key) ?? '{}' }),
    reset: () => {
      if (mode !== 'demo') throw new Error('只能重置本次体验，不能清空日常记录。');
      const initial = initialDemoStore(); save(initial); return initial;
    },
  };
}
