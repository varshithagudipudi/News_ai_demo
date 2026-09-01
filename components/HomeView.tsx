'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArticleGrid } from '@/components/ArticleGrid';
import { CategoryNav } from '@/components/CategoryNav';
import { FeaturedArticle } from '@/components/FeaturedArticle';
import { Pagination } from '@/components/Pagination';
import { SortControl } from '@/components/SortControl';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { SkeletonGrid } from '@/components/states/SkeletonGrid';
import { getCategoryName } from '@/lib/config/categories';
import { siteConfig } from '@/lib/config/site';
import type {
  Article,
  ArticleListResponse,
  Pagination as PaginationMeta,
  SortOrder,
} from '@/lib/types/article';

type Status = 'loading' | 'ready' | 'error';

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
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const requestId = useRef(0);

  useEffect(() => {
    const currentRequest = ++requestId.current;
    const controller = new AbortController();

    async function load() {
      setStatus('loading');

      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', String(siteConfig.defaultPageSize));

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
        if (currentRequest !== requestId.current) return;
        setArticles(payload.data);
        setPagination(payload.pagination);
        setStatus('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        if (currentRequest !== requestId.current) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Something went wrong while loading articles.',
        );
        setStatus('error');
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
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: true,
      });
    },
    [pathname, router, searchParams],
  );

  const showFeatured =
    page === 1 && sort === 'newest' && search === '' && status === 'ready';
  const featured = useMemo(
    () => (showFeatured ? pickFeatured(articles) : null),
    [showFeatured, articles],
  );
  const gridArticles = featured
    ? articles.filter((article) => article.id !== featured.id)
    : articles;

  const hasFilters = category !== 'all' || search !== '' || sort !== 'newest';

  const headingText = search
    ? `Results for “${search}”`
    : getCategoryName(category);

  return (
    <div className="mx-auto max-w-content px-4 py-8 sm:px-6">
      <div className="mb-6">
        <CategoryNav active={category} />
      </div>

      {featured && <FeaturedArticle article={featured} />}

      <section aria-labelledby="results-heading">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="results-heading"
              className="text-lg font-semibold text-fg"
            >
              {headingText}
            </h2>
            {status === 'ready' && pagination && (
              <p className="text-sm text-fg-muted">
                {pagination.total}{' '}
                {pagination.total === 1 ? 'article' : 'articles'}
              </p>
            )}
          </div>
          <SortControl value={sort} />
        </div>

        {status === 'loading' && <SkeletonGrid />}

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
              hasFilters
                ? 'No stories match these filters yet. Try a different category or clear the filters.'
                : 'No stories have been collected yet. Run the collection job, or seed development data, to populate the feed.'
            }
            actionLabel={hasFilters ? 'Clear filters' : undefined}
            onAction={
              hasFilters ? () => router.push(pathname) : undefined
            }
          />
        )}

        {status === 'ready' && gridArticles.length > 0 && (
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
  );
}
