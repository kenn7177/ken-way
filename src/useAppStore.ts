import { useCallback, useEffect, useRef, useState } from 'react';
import { initialStore, type AppMode, type Store } from './model';
import { initialDemoStore } from './experience';
import { createStoreRepository } from './storage';

export function useAppStore(mode: AppMode) {
  const [repository] = useState(() => createStoreRepository(mode, {
    local: { getItem: (key) => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) },
    session: { getItem: (key) => window.sessionStorage.getItem(key), setItem: (key, value) => window.sessionStorage.setItem(key, value) },
  }));
  const [boot] = useState(() => {
    try { return { store: repository.load(), error: '' }; }
    catch (error) { return { store: mode === 'demo' ? initialDemoStore() : initialStore(), error: error instanceof Error ? error.message : '无法读取浏览器存储。' }; }
  });
  const [store, setStore] = useState(boot.store);
  const [error, setError] = useState(boot.error);
  const current = useRef(store);
  const blocked = useRef(boot.error);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const expectedBank = mode === 'demo' ? window.sessionStorage : window.localStorage;
      if (event.storageArea !== expectedBank || (event.key !== repository.key && event.key !== null)) return;
      try {
        const next = repository.load(); current.current = next; setStore(next); blocked.current = ''; setError('');
      } catch (error) { blocked.current = '本地记录发生变化，请先导出备份后检查。'; setError(blocked.current); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [mode, repository]);
  const update = useCallback((change: (state: Store) => Store): Store | null => {
    try {
      if (blocked.current) throw new Error(blocked.current);
      const next = change(current.current);
      repository.save(next); current.current = next; setStore(next); setError(''); return next;
    } catch (error) { setError(error instanceof Error ? error.message : '暂时没有保存成功。'); return null; }
  }, [repository]);
  const exportRecord = () => blocked.current ? repository.rawBackup() : repository.export();
  return { store, current, error, setError, update, repository, exportRecord };
}
