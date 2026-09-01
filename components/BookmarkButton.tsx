'use client';

import { toggleBookmark } from '@/lib/bookmarks';
import { useIsBookmarked } from '@/lib/hooks/useBookmarks';
import type { Article } from '@/lib/types/article';
import { cn } from '@/lib/utils/cn';

interface BookmarkButtonProps {
  article: Article;
  className?: string;
}

export function BookmarkButton({ article, className }: BookmarkButtonProps) {
  const saved = useIsBookmarked(article.id);

  return (
    <button
      type="button"
      onClick={() => toggleBookmark(article)}
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove "${article.title}" from saved articles`
          : `Save "${article.title}" for later`
      }
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
        saved
          ? 'border-accent bg-accent text-accent-fg'
          : 'border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg',
        className,
      )}
    >
      {/* Fill state, not colour alone, communicates whether it is saved. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill={saved ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        <path d="M6 4h12v16l-6-4-6 4z" />
      </svg>
    </button>
  );
}
