'use client';
import { useEffect, useState } from 'react';
const STORAGE_KEY = 'ai-pulse-saved-creators';

export function readSavedCreatorIds(raw: string | null): string[] {
  try {
    const data: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(data) ? [...new Set(data.filter((id): id is string => typeof id === 'string'))] : [];
  } catch { return []; }
}

export function useSavedCreators() {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try { setSavedIds(readSavedCreatorIds(localStorage.getItem(STORAGE_KEY))); } catch { /* Storage is optional. */ }
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) setSavedIds(readSavedCreatorIds(event.newValue));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function toggleSaved(id: string) {
    const next = savedIds.includes(id) ? savedIds.filter((saved) => saved !== id) : [...savedIds, id];
    setSavedIds(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  return { savedIds, toggleSaved, storageError };
}
