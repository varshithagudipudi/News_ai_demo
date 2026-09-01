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
          'flex items-center justify-center bg-surface-muted',
          className,
        )}
        style={{
          backgroundImage: `linear-gradient(135deg, hsl(${hue} 55% 88%), hsl(${(hue + 45) % 360} 60% 78%))`,
        }}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-8 w-8 text-black/35"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 16 5-5 4 4 3-3 6 6" />
          <circle cx="9" cy="9.5" r="1.2" />
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
