/**
 * Domain types shared by the UI, the API layer and the ingestion pipeline.
 * Dates cross the API boundary as ISO 8601 strings.
 */

export interface Article {
  id: string;
  title: string;
  normalizedTitle: string;
  description: string | null;
  category: string;
  imageUrl: string | null;
  sourceName: string;
  sourceUrl: string | null;
  articleUrl: string;
  publishedAt: string;
  collectedAt: string;
  relevanceScore: number;
  isFeatured: boolean;
  provider: string;
  providerArticleId: string | null;
}

/** An article that has passed validation but has not been persisted yet. */
export type NewArticle = Omit<Article, 'id' | 'collectedAt'> & {
  rawMetadata?: Record<string, unknown> | null;
};

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ArticleListResponse {
  data: Article[];
  pagination: Pagination;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type SortOrder = 'newest' | 'oldest';

export interface ArticleQuery {
  category: string;
  search: string | null;
  sort: SortOrder;
  page: number;
  limit: number;
  /** Inclusive lower bound on `publishedAt`, ISO 8601. */
  startDate: string | null;
  /** Exclusive upper bound on `publishedAt`, ISO 8601. */
  endDate: string | null;
}

/** Per-run summary returned by the collection endpoint. */
export interface CollectionSummary {
  runId: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  fetched: number;
  inserted: number;
  skipped: number;
  duplicate: number;
  failed: number;
  enriched: number;
  categories: CategoryRunSummary[];
}

export interface CategoryRunSummary {
  category: string;
  fetched: number;
  inserted: number;
  skipped: number;
  duplicate: number;
  failed: number;
  error?: string;
}
