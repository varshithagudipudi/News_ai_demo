'use client';

import type { Article } from '@/lib/types/article';
import { ArticleImage } from '@/components/ArticleImage';
import { BookmarkButton } from '@/components/BookmarkButton';
import { CategoryBadge } from '@/components/CategoryBadge';
import { formatAbsoluteDate, formatRelativeDate } from '@/lib/utils/format';

interface ArticleCardProps {
  article: Article;
  /** Replaces the bookmark toggle with a remove action on the saved page. */
  onRemove?: (id: string) => void;
}

export function ArticleCard({ article, onRemove }: ArticleCardProps) {
  return (
    <article
      id={`article-${article.id}`}
      tabIndex={-1}
      className="news-card group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-muted">
        <ArticleImage
          src={article.imageUrl}
          alt={article.title}
          seed={article.id}
          className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <CategoryBadge slug={article.category} />

        <h3 className="line-clamp-3 text-xl font-bold leading-snug tracking-tight text-fg group-hover:text-accent">
          <a href={article.articleUrl} target="_blank" rel="noopener noreferrer">{article.title}</a>
        </h3>

        {article.description && (
          <p className="line-clamp-2 text-base leading-relaxed text-fg-muted">
            {article.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 text-xs text-fg-muted">
          <span className="font-bold text-fg">{article.sourceName}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt} title={article.publishedAt}>
            {formatRelativeDate(article.publishedAt)}
          </time>
          <span className="sr-only">
            Published {formatAbsoluteDate(article.publishedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <a
            href={article.articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
          >
            Read more
            <span className="sr-only"> about {article.title}</span>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>

          {onRemove ? (
            <button
              type="button"
              onClick={() => onRemove(article.id)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg hover:text-fg"
            >
              <span aria-hidden="true">✕</span>
              Remove
              <span className="sr-only"> {article.title} from saved</span>
            </button>
          ) : (
            <BookmarkButton article={article} />
          )}
        </div>
      </div>
    </article>
  );
}
