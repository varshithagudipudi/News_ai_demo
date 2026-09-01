'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { categories } from '@/lib/config/categories';
import { cn } from '@/lib/utils/cn';

/**
 * Real links (not buttons) so categories are shareable, middle-clickable and
 * keyboard navigable for free. Scrolls horizontally on small screens.
 */
export function CategoryNav({ active }: { active: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(slug: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    params.delete('page');
    const query = params.toString();
    const target = pathname === '/saved' ? '/' : pathname;
    return query ? `${target}?${query}` : target;
  }

  return (
    <nav aria-label="Article categories" className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const isActive = category.slug === active;
          return (
            <li key={category.slug} className="shrink-0">
              <Link
                href={hrefFor(category.slug)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-9 items-center rounded-full border px-4 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-border bg-surface text-fg-muted hover:bg-surface-muted hover:text-fg',
                )}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
