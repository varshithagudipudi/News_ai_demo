'use client';

import { useState } from 'react';
import type { Article } from '@/lib/types/article';

type NewsTickerProps = {
    articles: Article[];
    loading?: boolean;
    loadingMessage?: string;
    emptyMessage?: string;
};

export function NewsTicker({
    articles,
    loading = false,
    loadingMessage = 'Loading headlines…',
    emptyMessage = 'No headlines in this section yet.',
}: NewsTickerProps) {
    const [manualScroll, setManualScroll] = useState(false);
    const hasHeadlines = !loading && articles.length > 0;

    return (
        <section
            aria-label="Latest news"
            aria-busy={loading}
            data-manual={manualScroll}
            className="news-ticker sticky top-[var(--header-height,0px)] z-30 mb-6 flex h-14 overflow-hidden border border-border bg-surface-muted"
        >
            <button
                type="button"
                disabled={!hasHeadlines}
                aria-pressed={manualScroll}
                aria-controls="ticker-headlines"
                onClick={() => setManualScroll((current) => !current)}
                className="z-10 flex shrink-0 items-center gap-2 border-r border-border bg-accent-soft px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-accent"
            >
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
                {manualScroll && hasHeadlines ? 'Resume news' : 'The newswire'}
            </button>

            <div id="ticker-headlines" className="ticker-window flex min-w-0 flex-1 items-center overflow-hidden">
                {hasHeadlines ? (
                <div className="ticker-track flex w-max">
                    {[false, true].map((duplicate) => (
                        <div
                            key={String(duplicate)}
                            aria-hidden={duplicate ? true : undefined}
                            className={`ticker-group flex shrink-0 items-center ${duplicate ? 'ticker-copy' : ''
                                }`}
                        >
                            {articles.map((article) => (
                                <a
                                    key={article.id}
                                    href={`#article-${article.id}`}
                                    tabIndex={duplicate ? -1 : undefined}
                                    className="flex shrink-0 items-center gap-3 whitespace-nowrap px-5 py-3 text-sm text-fg hover:text-accent"
                                >
                                    <span
                                        aria-hidden="true"
                                        className="h-1.5 w-1.5 rounded-full bg-accent"
                                    />
                                    {article.title}
                                </a>
                            ))}
                        </div>
                    ))}
                </div>
                ) : (
                    <p
                        role={loading ? 'status' : undefined}
                        className="truncate px-5 py-3 text-sm leading-5 text-fg-muted"
                    >
                        {loading ? loadingMessage : emptyMessage}
                    </p>
                )}
            </div>
        </section>
    );
}

