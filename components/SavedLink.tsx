'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBookmarks } from '@/lib/hooks/useBookmarks';
import { useSavedJobs } from '@/lib/hooks/useSavedJobs';

export function SavedLink() {
  const bookmarks = useBookmarks();
  const { savedIds } = useSavedJobs();
  const inJobs = usePathname().startsWith('/jobs');
  const count = inJobs ? savedIds.length : bookmarks.length;

  return (
    <Link
      href={inJobs ? '/jobs?saved=true' : '/saved'}
      aria-label={`Saved ${inJobs ? 'jobs' : 'articles'} (${count} saved)`}
      className="relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-surface px-2.5 text-sm font-medium text-fg-muted transition-colors hover:border-accent hover:text-accent sm:px-3"
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
        <span className="absolute -right-1.5 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-fg sm:static">
          {count}
        </span>
      )}
    </Link>
  );
}
