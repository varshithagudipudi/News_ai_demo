'use client';

import type { Article } from '@/lib/types/article';

/**
 * Bookmarks are a POC-level feature: the full article snapshot is kept in
 * localStorage so the saved view works without another database round trip,
 * and nothing leaves the browser.
 */

const STORAGE_KEY = 'ai-pulse-bookmarks';
const MAX_BOOKMARKS = 200;

type Listener = () => void;

const listeners = new Set<Listener>();
let cache: Article[] | null = null;

function isArticleLike(value: unknown): value is Article {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Article>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.articleUrl === 'string'
  );
}

function read(): Article[] {
  if (typeof window === 'undefined') return [];
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed) ? parsed.filter(isArticleLike) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(next: Article[]) {
  cache = next.slice(0, MAX_BOOKMARKS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota or private-mode failure — the in-memory list still updates so the
    // current session behaves, it just will not survive a refresh.
  }
  listeners.forEach((listener) => listener());
}

export function subscribeToBookmarks(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getBookmarksSnapshot(): Article[] {
  return read();
}

export function getServerSnapshot(): Article[] {
  return EMPTY;
}

const EMPTY: Article[] = [];

export function toggleBookmark(article: Article): boolean {
  const current = read();
  const exists = current.some((item) => item.id === article.id);
  if (exists) {
    write(current.filter((item) => item.id !== article.id));
    return false;
  }
  write([article, ...current]);
  return true;
}

export function removeBookmark(id: string) {
  write(read().filter((item) => item.id !== id));
}

export function clearBookmarks() {
  write([]);
}

/** Keeps other tabs in sync. Registered once by the bookmarks hook. */
export function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  cache = null;
  listeners.forEach((listener) => listener());
}
