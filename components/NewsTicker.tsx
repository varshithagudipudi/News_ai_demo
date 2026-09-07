'use client';

import { useState } from 'react';
import type { Article } from '@/lib/types/article';

type NewsTickerProps = {
    articles: Article[];
};

export function NewsTicker({ articles }: NewsTickerProps) {
    const [manualScroll, setManualScroll] = useState(false);

    if (articles.length === 0) return null;

    return (
        <section
            aria-label="Latest news"
            data-manual={manualScroll}
            className="news-ticker sticky top-[var(--header-height,0px)] z-30 mb-6 flex overflow-hidden border border-border bg-surface-muted"
        >
            <button
                type="button"
                aria-pressed={manualScroll}
                aria-controls="ticker-headlines"
                onClick={() => setManualScroll((current) => !current)}
                className="z-10 flex shrink-0 items-center bg-accent px-4 py-3 text-xs font-bold uppercase tracking-wide text-accent-fg"
            >
                {manualScroll ? 'Resume news' : 'Latest news'}
            </button>

            <div id="ticker-headlines" className="ticker-window min-w-0 flex-1 overflow-hidden">
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
            </div>
        </section>
    );
}

