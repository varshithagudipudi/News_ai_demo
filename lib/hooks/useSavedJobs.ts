'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { legacyJobIds } from '@/lib/jobs/sources';
const KEY = 'ai-pulse-saved-jobs';
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;
let storageError = false;
export function parseSavedJobs(raw: string | null): string[] {
  try { const data: unknown = JSON.parse(raw ?? '[]'); return Array.isArray(data) ? [...new Set(data.filter((id): id is string => typeof id === 'string').map((id) => legacyJobIds[id] ?? id))] : []; }
  catch { return []; }
}
function read() {
  if (cache) return cache;
  try { cache = parseSavedJobs(localStorage.getItem(KEY)); } catch { cache = []; }
  return cache;
}
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function toggleSavedJob(id: string) {
  const current = read();
  cache = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  try { localStorage.setItem(KEY, JSON.stringify(cache)); storageError = false; } catch { storageError = true; }
  listeners.forEach((listener) => listener());
}
export function useSavedJobs() {
  const savedIds = useSyncExternalStore(subscribe, read, () => EMPTY);
  const error = useSyncExternalStore(subscribe, () => storageError, () => false);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== null && event.key !== KEY) return;
      cache = null;
      listeners.forEach((listener) => listener());
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  return { savedIds, storageError: error };
}
