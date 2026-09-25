import { blogPromotion } from '@/lib/config/blogPromotion';
import Image from 'next/image';

export function BlogPromotion() {
  if (!blogPromotion.enabled) return null;

  return (
    <aside aria-labelledby="blog-promotion-title" className="blog-ad-slot">
      <p className="mb-3 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-fg-muted">Advertisement · {blogPromotion.label}</p>
      <a
        href={blogPromotion.url}
        target="_blank"
        rel="noopener noreferrer"
        className="blog-promotion"
      >
        <div className="blog-ad-banner" aria-hidden="true">
          <span>{blogPromotion.bannerTitle}</span>
          <span>{blogPromotion.bannerSubtitle}</span>
        </div>
        <div className="blog-ad-image">
          <Image src={blogPromotion.image} alt={blogPromotion.imageAlt} fill sizes="300px" className="object-cover object-top" />
          <span className="blog-ad-image-label">Interactive review</span>
        </div>
        <div className="blog-ad-copy">
          <h2 id="blog-promotion-title" className="blog-ad-headline">
            {blogPromotion.title}: {blogPromotion.summary}
          </h2>
          <span className="blog-ad-button">
            <span>A field guide <span aria-hidden="true">·</span> {blogPromotion.linkLabel}</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16m-6-6 6 6-6 6" />
            </svg>
          </span>
        </div>
        <span className="sr-only">Opens {blogPromotion.title} in a new tab.</span>
      </a>
    </aside>
  );
}
