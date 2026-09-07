'use client';

import Link from 'next/link';
import { useBookmarks } from '@/lib/hooks/useBookmarks';

export function SavedLink() {
  const bookmarks = useBookmarks();
  const count = bookmarks.length;

  return (
    <Link
      href="/saved"
      aria-label={`Saved articles (${count} saved)`}
      className="relative inline-flex h-10 items-center gap-2 rounded-none border border-border bg-surface px-3 text-sm font-bold uppercase tracking-wide text-fg-muted transition-colors hover:border-accent hover:text-accent"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        <path d="M6 4h12v16l-6-4-6 4z" />
      </svg>
      <span className="hidden sm:inline">Saved</span>
      {count > 0 && (
        <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-fg">
          {count}
        </span>
      )}
    </Link>
  );
}
