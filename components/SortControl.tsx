'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SortOrder } from '@/lib/types/article';

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
    router.push(query ? `${pathname}?${query}` : pathname);
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
        className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-fg"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>
  );
}
