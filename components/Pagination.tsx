'use client';

import type { Pagination as PaginationMeta } from '@/lib/types/article';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, total, limit } = pagination;
  if (totalPages <= 1) return null;

  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <nav
      aria-label="Article pages"
      className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
    >
      <p aria-live="polite" className="text-sm text-fg-muted">
        Showing <strong className="text-fg">{first}</strong>–
        <strong className="text-fg">{last}</strong> of{' '}
        <strong className="text-fg">{total}</strong> articles
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-9 items-center rounded-none border border-border bg-surface px-3 text-sm font-bold uppercase tracking-wide text-fg transition-colors hover:border-fg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="px-1 text-sm text-fg-muted">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-9 items-center rounded-none border border-border bg-surface px-3 text-sm font-bold uppercase tracking-wide text-fg transition-colors hover:border-fg disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
