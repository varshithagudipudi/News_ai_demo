'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArticleGrid } from '@/components/ArticleGrid';
import { EmptyState } from '@/components/states/EmptyState';
import { SkeletonGrid } from '@/components/states/SkeletonGrid';
import { clearBookmarks, removeBookmark } from '@/lib/bookmarks';
import { useBookmarks } from '@/lib/hooks/useBookmarks';

export function SavedView() {
  const bookmarks = useBookmarks();
  // localStorage is unavailable during SSR, so hold the skeleton until mount
  // rather than flashing "nothing saved" to someone who has saved articles.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      {mounted && bookmarks.length > 0 && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="font-bold text-accent hover:underline"
          >
            Back to all news
          </Link>
          <button
            type="button"
            onClick={clearBookmarks}
            className="inline-flex h-9 items-center rounded-none border border-border bg-surface px-3 text-sm font-bold uppercase tracking-wide text-fg transition-colors hover:border-accent hover:text-accent">
          
            Remove all
          </button>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold uppercase tracking-tight text-fg">
            Saved articles
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            Saved articles live only in this browser. They are not synced to an
            account and will disappear if you clear your browser data or switch
            devices.
          </p>
        </div>
      </div>

      {!mounted && <SkeletonGrid count={3} />}

      {mounted && bookmarks.length === 0 && (
        <EmptyState
          title="Nothing saved yet"
          message="Use the bookmark button on any article card to keep it here for later."
        />
      )}

      {mounted && bookmarks.length > 0 && (
        <>
          <ArticleGrid
            articles={bookmarks}
            label="Saved articles"
            onRemove={removeBookmark}
          />
        </>
      )}
    </div>
  );
}
