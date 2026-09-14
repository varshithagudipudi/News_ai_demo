'use client';

import type { ComponentProps } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { updateFeedLocation } from '@/lib/utils/feedNavigation';

type FeedLinkProps = Omit<ComponentProps<typeof Link>, 'href' | 'onNavigate'> & {
  href: string;
};

/** Preserve normal link/new-tab behavior, but update feed filters locally. */
export function FeedLink({ href, scroll, ...props }: FeedLinkProps) {
  const pathname = usePathname();
  return (
    <Link
      {...props}
      href={href}
      scroll={scroll}
      prefetch={pathname === '/' ? false : undefined}
      onNavigate={(event) => {
        if (!updateFeedLocation(href)) return;
        event.preventDefault();
        if (scroll !== false) window.scrollTo({ top: 0, behavior: 'instant' });
      }}
    />
  );
}
