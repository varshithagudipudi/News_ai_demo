'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  getBookmarksSnapshot,
  getServerSnapshot,
  handleStorageEvent,
  subscribeToBookmarks,
} from '@/lib/bookmarks';
import type { Article } from '@/lib/types/article';

export function useBookmarks(): Article[] {
  const bookmarks = useSyncExternalStore(
    subscribeToBookmarks,
    getBookmarksSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  return bookmarks;
}

export function useIsBookmarked(id: string): boolean {
  const bookmarks = useBookmarks();
  return bookmarks.some((item) => item.id === id);
}
