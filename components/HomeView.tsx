'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArticleGrid } from '@/components/ArticleGrid';
import { BlogPromotion } from '@/components/BlogPromotion';
import { CategoryNav } from '@/components/CategoryNav';
import { CreatorDirectory } from '@/components/CreatorDirectory';
import { FeaturedArticle } from '@/components/FeaturedArticle';
import { FeedLink } from '@/components/FeedLink';
import { NewsBriefing } from '@/components/NewsBriefing';
import { Pagination } from '@/components/Pagination';
import { SortControl } from '@/components/SortControl';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { SkeletonGrid } from '@/components/states/SkeletonGrid';
import { getCategoryName } from '@/lib/config/categories';
import { siteConfig } from '@/lib/config/site';
import { blogPromotion } from '@/lib/config/blogPromotion';
import { NewsTicker } from '@/components/NewsTicker';
import { updateFeedLocation } from '@/lib/utils/feedNavigation';
import { publishSearchFeedback } from '@/lib/utils/searchPanel';
import type {
  Article,
  ArticleListResponse,
  SortOrder,
} from '@/lib/types/article';

type Status = 'loading' | 'ready' | 'error';

type FeedSnapshot = {
  payload: ArticleListResponse;
  category: string;
  search: string;
  sort: SortOrder;
  page: number;
};

const EVENTS_CATEGORY_SLUG = 'ai-events';
const CREATORS_CATEGORY_SLUG = 'ai-content-creators';

const EVENTS_WINDOW_DAYS = 30;
const EMPTY_ARTICLES: Article[] = [];

/** [start, end) covering the trailing N days up to now. */
function trailingWindowRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

const EVENTS_WINDOW_LABEL = `Last ${EVENTS_WINDOW_DAYS} days`;

/**
 * Picks a featured story: the strongest article among the newest few. Only
 * used on the first page of an unfiltered, newest-first listing.
 */
function pickFeatured(articles: Article[]): Article | null {
  if (articles.length === 0) return null;
  const candidates = articles.slice(0, 6);
  return candidates.reduce((best, current) =>
    current.relevanceScore > best.relevanceScore ? current : best,
  );
}

export function HomeView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = searchParams.get('category') ?? 'all';
  const search = searchParams.get('search')?.trim() ?? '';
  const sort = (searchParams.get('sort') === 'oldest'
    ? 'oldest'
    : 'newest') as SortOrder;
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);

  const [status, setStatus] = useState<Status>('loading');
  const [feed, setFeed] = useState<FeedSnapshot | null>(null);
  const articles = feed?.payload.data ?? EMPTY_ARTICLES;
  const pagination = feed?.payload.pagination ?? null;
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const requestId = useRef(0);

  useEffect(() => {
    // The creator directory is local, static data — it has no article feed to fetch.
    if (category === CREATORS_CATEGORY_SLUG) return;

    const currentRequest = ++requestId.current;
    const controller = new AbortController();

    async function load() {
      setStatus('loading');
      publishSearchFeedback({ query: search, status: 'loading' });

      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', String(siteConfig.defaultPageSize));
      if (category === EVENTS_CATEGORY_SLUG) {
        const { start, end } = trailingWindowRange(EVENTS_WINDOW_DAYS);
        params.set('startDate', start);
        params.set('endDate', end);
      }

      try {
        const response = await fetch(`/api/articles?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            response.status >= 500
              ? 'The news service is temporarily unavailable.'
              : 'That request could not be completed.',
          );
        }
        const payload = (await response.json()) as ArticleListResponse;
        if (controller.signal.aborted || currentRequest !== requestId.current) return;
        setFeed({ payload, category, search, sort, page });
        setStatus('ready');
        publishSearchFeedback({ query: search, status: 'ready', total: payload.pagination.total });
      } catch (error) {
        if (controller.signal.aborted) return;
        if (currentRequest !== requestId.current) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading articles.',
        );
        setStatus('error');
        publishSearchFeedback({ query: search, status: 'error' });
      }
    }

    void load();
    return () => controller.abort();
  }, [category, search, sort, page, reloadToken]);

  const setParam = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) params.delete(key);
        else params.set(key, value);
      }
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (!updateFeedLocation(href)) router.push(href);
    },
    [pathname, router, searchParams],
  );

  // Keep the previous result and its labels intact until the next request succeeds.
  const displayed = feed ?? { category, search, sort, page };
  const showFeatured =
    feed !== null && displayed.page === 1 && displayed.sort === 'newest' && displayed.search === '';
  const featured = useMemo(
    () => (showFeatured ? pickFeatured(articles) : null),
    [showFeatured, articles],
  );
  const gridArticles = featured
    ? articles.filter((article) => article.id !== featured.id)
    : articles;

  const hasFilters = category !== 'all' || search !== '' || sort !== 'newest';
  const showBlogPromotion = blogPromotion.enabled && category === 'all' && search === '' && page === 1;

  const headingText = displayed.search
    ? `Results for “${displayed.search}”`
    : displayed.category === EVENTS_CATEGORY_SLUG
      ? `${getCategoryName(displayed.category)} — ${EVENTS_WINDOW_LABEL}`
      : getCategoryName(displayed.category);

  if (category === CREATORS_CATEGORY_SLUG) return <CreatorDirectory />;

  return (
    <div className="mx-auto max-w-content px-4 pb-16 pt-6 sm:px-6">
      <section aria-labelledby="page-heading" className="news-intro mb-6">
        <div className="relative z-10 min-w-0">
          <p className="section-eyebrow mb-4 flex items-center gap-2.5">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent ring-4 ring-accent/10" />
            Your window into what&apos;s next
          </p>
          <h1 id="page-heading" className="text-[32px] font-bold leading-[1.1] tracking-[-0.045em] text-fg sm:text-[42px] xl:text-5xl">
            The world of AI. <span className="text-accent">In focus.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-[15px]">
            The breakthroughs, builders, and big ideas moving AI forward.
          </p>
        </div>
        <div className="intro-discover relative z-10">
          <div className="mb-3 flex items-center gap-2 text-accent">
            <svg aria-hidden="true" viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-8"><path d="M1 10h7l4-8 7 16 4-8h8" /></svg>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Follow the signal</span>
          </div>
          <p className="font-display text-xl font-semibold tracking-tight text-fg">Stay curious. Stay ahead.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: 'Research', category: 'machine-learning' },
              { label: 'AI tools', category: 'ai-tools' },
              { label: 'Creators', category: CREATORS_CATEGORY_SLUG },
            ].map((topic) => (
              <FeedLink key={topic.category} href={`/?category=${topic.category}`} scroll={false} className="intro-topic">
                {topic.label}<span aria-hidden="true">↗</span>
              </FeedLink>
            ))}
          </div>
        </div>
      </section>
      <NewsTicker
        articles={status === 'ready' && category !== CREATORS_CATEGORY_SLUG ? articles : []}
        loading={status === 'loading' && category !== CREATORS_CATEGORY_SLUG}
        loadingMessage={`Loading ${getCategoryName(category).toLowerCase()}…`}
        emptyMessage={
          category === CREATORS_CATEGORY_SLUG
            ? 'Explore the voices shaping AI in the creator directory.'
            : status === 'error'
              ? 'Headlines are temporarily unavailable.'
              : 'No headlines in this section yet.'
        }
      />
      <div className="mb-6">
        <CategoryNav active={category} />
      </div>

        <div aria-busy={status === 'loading'}>
          {featured && (
            <div className={`mb-10 grid items-start gap-6 ${showBlogPromotion ? 'xl:grid-cols-[minmax(0,1fr)_300px]' : gridArticles.length > 0 ? 'xl:grid-cols-[minmax(0,1fr)_310px]' : ''}`}>
              <FeaturedArticle article={featured} />
              {showBlogPromotion ? <BlogPromotion /> : gridArticles.length > 0 && <NewsBriefing articles={gridArticles} />}
            </div>
          )}

          {showBlogPromotion && !featured && <div className="mb-10"><BlogPromotion /></div>}

          <section aria-labelledby="results-heading">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-wrap items-center gap-3">
                <h2
                  id="results-heading"
                  className="text-2xl font-bold tracking-tight text-fg"
                >
                  {displayed.category === 'all' && !displayed.search ? 'The latest' : headingText}
                </h2>
                {pagination && (
                  <p className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-fg-muted">
                    {pagination.total}{' '}
                    {pagination.total === 1 ? 'article' : 'articles'}
                  </p>
                )}
              </div>
              <SortControl value={sort} />
            </div>

            {status === 'loading' && !feed && <SkeletonGrid />}

            {status === 'error' && (
              <ErrorState
                message={errorMessage}
                onRetry={() => setReloadToken((token) => token + 1)}
              />
            )}

            {status === 'ready' && gridArticles.length === 0 && !featured && (
              <EmptyState
                title="No articles found"
                message={
                  category === EVENTS_CATEGORY_SLUG
                    ? `No AI events found in the ${EVENTS_WINDOW_LABEL.toLowerCase()}.`
                    : hasFilters
                      ? 'No stories match these filters yet. Try a different category or clear the filters.'
                      : 'Your next read is on its way. Check back soon for the latest AI stories.'
                }
                actionLabel={hasFilters ? 'Clear filters' : undefined}
                onAction={
                  hasFilters ? () => {
                    if (!updateFeedLocation(pathname)) router.push(pathname);
                  } : undefined
                }
              />
            )}

            {gridArticles.length > 0 && (
              <ArticleGrid articles={gridArticles} label="Latest articles" />
            )}

            {status === 'ready' && pagination && (
              <Pagination
                pagination={pagination}
                onPageChange={(next) =>
                  setParam({ page: next === 1 ? null : String(next) })
                }
              />
            )}
          </section>
        </div>
    </div>
  );
}
