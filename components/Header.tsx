'use client';

import { Suspense, useEffect, useRef } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/lib/config/site';
import { SearchBar } from '@/components/SearchBar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SavedLink } from '@/components/SavedLink';


export function Header() {
  const headerRef = useRef<HTMLElement>(null);

useEffect(() => {
  const header = headerRef.current;
  if (!header) return;

  const updateHeight = () => {
    document.documentElement.style.setProperty(
      '--header-height',
      `${header.getBoundingClientRect().height}px`,
    );
  };

  updateHeight();

  const observer = new ResizeObserver(updateHeight);
  observer.observe(header);

  return () => observer.disconnect();
}, []);
  return (
    <header 
    ref={headerRef}
    className="sticky top-0 z-40 border-b-2 border-fg bg-bg">
      <div className="mx-auto flex max-w-content flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-6">
        <div className="flex items-center justify-between gap-3 md:justify-start">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-extrabold uppercase tracking-tight text-[#7510e1]"
          >
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center bg-[#7510e1] text-sm font-extrabold text-white"
            >
              AI
            </span>
            {siteConfig.name}
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <SavedLink />
            <ThemeToggle />
          </div>
        </div>

        <div className="md:flex-1">
          <Suspense
            fallback={
              <div
                aria-hidden="true"
                className="h-[38px] w-full rounded-lg border border-border bg-surface"
              />
            }
          >
            <SearchBar />
          </Suspense>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <SavedLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
