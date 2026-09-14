'use client';
import NextLink from 'next/link';
import { FeedLink as Link } from '@/components/FeedLink';
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
    <nav
      aria-label="Article categories"
      className="rounded-xl border border-border bg-surface p-1.5"
    >
      <ul className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {categories.map((category) => {
          const isActive = category.slug === active;
          return (
            <li key={category.slug} className="shrink-0">
              <Link
                href={hrefFor(category.slug)}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center rounded-lg px-3.5 text-xs font-semibold uppercase transition-colors',
                  isActive
                    ? 'bg-accent text-accent-fg'
                    : 'text-fg-muted hover:bg-accent-soft hover:text-accent',
                )}
              >
                {category.name}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0">
          <NextLink
            href="/jobs"
            className="inline-flex h-10 items-center rounded-lg px-3.5 text-xs font-semibold uppercase text-fg-muted transition-colors hover:bg-accent-soft hover:text-accent"
          >
            AI Jobs
          </NextLink>
        </li>
      </ul>
    </nav>
  );
}
