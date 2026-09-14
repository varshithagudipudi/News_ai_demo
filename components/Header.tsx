'use client';

import { Suspense, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FeedLink as Link } from '@/components/FeedLink';
import { siteConfig } from '@/lib/config/site';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SavedLink } from '@/components/SavedLink';
import { OPEN_SEARCH_EVENT } from '@/lib/utils/searchPanel';

const navigation = [
  { label: 'News', href: '/', category: 'news' },
  { label: 'AI tools', href: '/?category=ai-tools', category: 'ai-tools' },
  { label: 'Creators', href: '/?category=ai-content-creators', category: 'ai-content-creators' },
  { label: 'Jobs', href: '/jobs', category: 'jobs' },
];

function NavigationLinks({ active }: { active?: string }) {
  return (
    <nav aria-label="Main navigation" className="header-navigation">
      {navigation.map((item) => (
        <Link
          key={item.category}
          href={item.href}
          aria-current={active === item.category ? 'page' : undefined}
          className="header-nav-link"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function MainNavigation() {
  const pathname = usePathname();
  const params = useSearchParams();
  const category = params.get('category');
  const active = pathname.startsWith('/jobs') ? 'jobs' : pathname !== '/' ? undefined
    : category === 'ai-tools' || category === 'ai-content-creators' ? category : 'news';
  return <NavigationLinks active={active} />;
}

function SearchTrigger() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      type="button"
      aria-label="Focus search"
      aria-controls="site-search"
      onClick={() => {
        window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
        const input = document.getElementById('site-search');
        input?.focus({ preventScroll: true });
        if (input?.closest('#creator-directory, #jobs-board')) input.scrollIntoView({ block: 'center', behavior: 'instant' });
        if (!input && pathname.startsWith('/jobs')) router.push('/jobs?focus=search');
      }}
      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-2.5 text-sm text-fg-muted transition-colors hover:border-accent hover:text-accent sm:px-3"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span className="hidden xl:inline">Search</span>
    </button>
  );
}

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
      className="site-chrome site-header sticky top-0 z-40 border-b border-border bg-surface text-fg"
    >
      <div className="header-layout px-4 sm:px-6">
        <Link
          href="/"
          className="flex w-fit shrink-0 items-center gap-2 whitespace-nowrap font-display text-xl font-bold tracking-tight text-fg sm:gap-3 sm:text-2xl"
        >
          <span
            aria-hidden="true"
            className="header-brand-icon flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accent-fg sm:h-11 sm:w-11"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M2 12h5l3-8 4 16 3-8h5" />
            </svg>
          </span>
          <span>
            {siteConfig.name}
            <span className="mt-0.5 hidden font-sans text-[9px] font-medium uppercase tracking-[0.2em] text-fg-muted sm:block">Intelligence, daily.</span>
          </span>
        </Link>
        <Suspense fallback={<NavigationLinks />}>
          <MainNavigation />
        </Suspense>
        <div className="header-actions flex items-center gap-1.5 sm:gap-2">
          <SearchTrigger />
          <SavedLink />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
