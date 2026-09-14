'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface ArticleImageProps {
  src: string | null;
  alt: string;
  className?: string;
  /** Rendered instead of the image when the source is missing or fails. */
  seed: string;
}

/** Deterministic hue so a given article always gets the same fallback tint. */
function hueFromSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) % 360;
  }
  return hash;
}

/**
 * Publisher images come from arbitrary hosts and frequently 404 or hotlink-
 * block. A plain <img> with an onError swap keeps the card usable either way.
 */
export function ArticleImage({ src, alt, className, seed }: ArticleImageProps) {
  const [failed, setFailed] = useState(src === null);

  useEffect(() => {
    setFailed(src === null);
  }, [src]);

  if (failed || !src) {
    const hue = hueFromSeed(seed);
    return (
      <div
        role="img"
        aria-label={`${alt} (no image available)`}
        className={cn(
          'article-art flex items-center justify-center bg-surface-muted',
          className,
        )}
        style={{
          backgroundImage: `radial-gradient(ellipse at 70% 20%, hsl(${hue} 45% 38%), transparent 70%), linear-gradient(135deg, hsl(${hue} 35% 12%), hsl(${(hue + 45) % 360} 40% 25%))`,
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-16 w-16 text-white/70"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="6" width="12" height="12" rx="3" />
          <rect x="9" y="9" width="6" height="6" rx="1" />
          <path d="M9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3" />
        </svg>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
