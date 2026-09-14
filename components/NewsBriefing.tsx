import { FeedLink as Link } from '@/components/FeedLink';
import type { Article } from '@/lib/types/article';
import { formatRelativeDate } from '@/lib/utils/format';

export function NewsBriefing({ articles }: { articles: Article[] }) {
  return (
    <aside aria-labelledby="briefing-heading" className="min-w-0">
      <h2 id="briefing-heading" className="section-eyebrow mb-4">The quick read</h2>
      <div className="briefing-panel rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="font-display text-lg font-bold tracking-tight">On your radar</p>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-accent">
            <path d="m3 17 6-6 4 4 8-10M15 5h6v6" />
          </svg>
        </div>
        <ol className="divide-y divide-border">
          {articles.slice(0, 3).map((article, index) => (
            <li key={article.id} className="flex gap-3 py-4">
              <span aria-hidden="true" className="pt-0.5 font-mono text-sm text-accent/70">0{index + 1}</span>
              <div className="min-w-0">
                <a href={article.articleUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-3 text-sm font-semibold leading-relaxed text-fg transition-colors hover:text-accent">
                  {article.title}
                </a>
                <p className="mt-2 text-xs text-fg-muted">
                  {article.sourceName} <span aria-hidden="true">&middot;</span>{' '}
                  <time dateTime={article.publishedAt}>{formatRelativeDate(article.publishedAt)}</time>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/?category=ai-content-creators" className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs font-semibold text-accent hover:underline">
          Meet the voices shaping AI <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </aside>
  );
}
