'use client';

import type { Article } from '@/lib/types/article';
import { ArticleImage } from '@/components/ArticleImage';
import { BookmarkButton } from '@/components/BookmarkButton';
import { CategoryBadge } from '@/components/CategoryBadge';
import { formatAbsoluteDate, formatRelativeDate } from '@/lib/utils/format';

export function FeaturedArticle({ article }: { article: Article }) {
  return (
    <section aria-labelledby="featured-heading" className="mb-10">
      <h2
        id="featured-heading"
        className="mb-3 text-xs font-bold uppercase tracking-widest text-accent"
      >
        Featured story
      </h2>

      <article
        id={`article-${article.id}`}
        tabIndex={-1}
        className="grid overflow-hidden border border-border bg-surface md:grid-cols-2">
        <div className="relative aspect-[16/9] w-full md:aspect-auto md:h-full md:min-h-64">
          <ArticleImage
            src={article.imageUrl}
            alt={article.title}
            seed={article.id}
            className="h-full w-full"
          />
        </div>

        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <div className="flex flex-wrap items-center gap-3">
            <CategoryBadge slug={article.category} />
            <span className="text-xs uppercase tracking-wide text-fg-muted">
              <span className="font-bold text-fg">{article.sourceName}</span>
              <span aria-hidden="true"> · </span>
              <time dateTime={article.publishedAt}>
                {formatRelativeDate(article.publishedAt)}
              </time>
              <span className="sr-only">
                , published {formatAbsoluteDate(article.publishedAt)}
              </span>
            </span>
          </div>

          <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-fg sm:text-3xl">
            {article.title}
          </h3>

          {article.description && (
            <p className="line-clamp-4 text-sm leading-relaxed text-fg-muted sm:text-base">
              {article.description}
            </p>
          )}

          <div className="mt-auto flex items-center gap-3 pt-2">
            <a
              href={article.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-none bg-fg px-4 text-sm font-bold uppercase tracking-wide text-bg transition-colors hover:bg-accent hover:text-accent-fg"
            >
              Read full story
              <span className="sr-only"> at {article.sourceName}</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
            <BookmarkButton article={article} className="h-10 w-10" />
          </div>
        </div>
      </article>
    </section>
  );
}
