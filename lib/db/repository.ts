import type { Article, ArticleQuery } from '@/lib/types/article';
import type { ValidatedNewArticle } from '@/lib/validation/article';

export interface ListResult {
  items: Article[];
  total: number;
}

/** Minimal identity of an already-stored article, used for deduplication. */
export interface ArticleFingerprint {
  articleUrl: string;
  normalizedTitle: string;
  sourceName: string;
  publishedAt: string;
}

export interface InsertResult {
  inserted: number;
  duplicate: number;
  failed: number;
}

/**
 * Storage contract. Two implementations exist — Supabase Postgres and a local
 * JSON store used when Supabase is not configured — and the product behaves
 * identically on either.
 */
export interface ArticleRepository {
  readonly name: string;

  list(query: ArticleQuery): Promise<ListResult>;

  /** Existing article URLs from the given candidate list. */
  findExistingUrls(urls: string[]): Promise<Set<string>>;

  /** Fingerprints of articles published at or after `sinceIso`. */
  findRecentFingerprints(sinceIso: string): Promise<ArticleFingerprint[]>;

  /**
   * Inserts new articles. Existing rows (matched on article_url) are left in
   * place; a stored value is never replaced with an empty one.
   */
  insertMany(articles: ValidatedNewArticle[]): Promise<InsertResult>;

  count(): Promise<number>;

  /** Deletes every article. Development helper, used only by the seed script. */
  deleteAll(): Promise<void>;

  /** Returns false when another run already holds the lock. */
  acquireLock(name: string, ttlMs: number): Promise<boolean>;

  releaseLock(name: string): Promise<void>;
}
