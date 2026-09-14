'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SortOrder } from '@/lib/types/article';
import { updateFeedLocation } from '@/lib/utils/feedNavigation';

export function SortControl({ value }: { value: SortOrder }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'newest') params.delete('sort');
    else params.set('sort', next);
    params.delete('page');
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    if (!updateFeedLocation(href)) router.push(href);
  }

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-order"
        className="text-sm font-medium text-fg-muted"
      >
        Sort
      </label>
      <select
        id="sort-order"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-fg"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>
  );
}
