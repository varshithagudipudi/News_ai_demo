'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const DEBOUNCE_MS = 350;

/**
 * Search state lives in the URL (`?search=`) so results are shareable and the
 * back button behaves. Typing debounces; submitting applies immediately.
 */
export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get('search') ?? '';

  const [value, setValue] = useState(urlValue);
  const lastPushed = useRef(urlValue);

  // Adopt external changes (Clear Filters, back button) without fighting typing.
  useEffect(() => {
    if (urlValue !== lastPushed.current) {
      lastPushed.current = urlValue;
      setValue(urlValue);
    }
  }, [urlValue]);

  function apply(next: string) {
    const trimmed = next.trim();
    if (trimmed === lastPushed.current) return;
    lastPushed.current = trimmed;

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) params.set('search', trimmed);
    else params.delete('search');
    params.delete('page');

    const target = pathname === '/saved' ? '/' : pathname;
    const query = params.toString();
    router.push(query ? `${target}?${query}` : target);
  }

  useEffect(() => {
    const timer = setTimeout(() => apply(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // `apply` is intentionally not a dependency: it closes over router state
    // that changes on every render and would restart the timer each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(event) => {
        event.preventDefault();
        apply(value);
      }}
    >
      <label htmlFor="site-search" className="sr-only">
        Search articles
      </label>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id="site-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search AI &amp; startup news"
        className="w-full rounded-none border border-border bg-[#F5F5F5] dark:bg-surface-muted py-2 pl-9 pr-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent"
      />
    </form>
  );
}
