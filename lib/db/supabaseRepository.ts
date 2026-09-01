import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from '@/lib/config/env';
import type { Article, ArticleQuery } from '@/lib/types/article';
import type { ValidatedNewArticle } from '@/lib/validation/article';
import type {
  ArticleFingerprint,
  ArticleRepository,
  InsertResult,
  ListResult,
} from '@/lib/db/repository';

const TABLE = 'articles';
const LOCK_TABLE = 'collection_locks';
const UNIQUE_VIOLATION = '23505';

interface ArticleRow {
  id: string;
  title: string;
  normalized_title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  source_name: string;
  source_url: string | null;
  article_url: string;
  published_at: string;
  collected_at: string;
  relevance_score: number | string;
  is_featured: boolean;
  provider: string;
  provider_article_id: string | null;
}

function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    title: row.title,
    normalizedTitle: row.normalized_title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    articleUrl: row.article_url,
    publishedAt: new Date(row.published_at).toISOString(),
    collectedAt: new Date(row.collected_at).toISOString(),
    relevanceScore: Number(row.relevance_score) || 0,
    isFeatured: row.is_featured,
    provider: row.provider,
    providerArticleId: row.provider_article_id,
  };
}

function toRow(article: ValidatedNewArticle) {
  return {
    title: article.title,
    normalized_title: article.normalizedTitle,
    description: article.description,
    category: article.category,
    image_url: article.imageUrl,
    source_name: article.sourceName,
    source_url: article.sourceUrl,
    article_url: article.articleUrl,
    published_at: article.publishedAt,
    relevance_score: article.relevanceScore,
    is_featured: article.isFeatured,
    provider: article.provider,
    provider_article_id: article.providerArticleId,
    raw_metadata: article.rawMetadata,
  };
}

/**
 * PostgREST `or()` filters are comma-separated, so characters that would change
 * the meaning of the filter string are stripped before interpolation.
 */
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,()"'\\%*]/g, ' ').trim();
}

const SELECT_COLUMNS =
  'id,title,normalized_title,description,category,image_url,source_name,source_url,article_url,published_at,collected_at,relevance_score,is_featured,provider,provider_article_id';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return client;
}

export function createSupabaseRepository(): ArticleRepository {
  return {
    name: 'supabase',

    async list(query: ArticleQuery): Promise<ListResult> {
      let request = getClient()
        .from(TABLE)
        .select(SELECT_COLUMNS, { count: 'exact' });

      if (query.category !== 'all') {
        request = request.eq('category', query.category);
      }

      if (query.search) {
        const term = sanitizeSearchTerm(query.search);
        if (term) {
          request = request.or(
            `title.ilike.%${term}%,description.ilike.%${term}%`,
          );
        }
      }

      const from = (query.page - 1) * query.limit;
      const { data, error, count } = await request
        .order('published_at', { ascending: query.sort === 'oldest' })
        .range(from, from + query.limit - 1);

      if (error) throw new Error(`Failed to list articles: ${error.message}`);

      return {
        items: (data as unknown as ArticleRow[]).map(toArticle),
        total: count ?? 0,
      };
    },

    async findExistingUrls(urls: string[]): Promise<Set<string>> {
      if (urls.length === 0) return new Set();
      const { data, error } = await getClient()
        .from(TABLE)
        .select('article_url')
        .in('article_url', urls);

      if (error) throw new Error(`Duplicate lookup failed: ${error.message}`);
      return new Set(
        (data as { article_url: string }[]).map((row) => row.article_url),
      );
    },

    async findRecentFingerprints(
      sinceIso: string,
    ): Promise<ArticleFingerprint[]> {
      const { data, error } = await getClient()
        .from(TABLE)
        .select('article_url,normalized_title,source_name,published_at')
        .gte('published_at', sinceIso)
        .limit(2000);

      if (error) throw new Error(`Fingerprint lookup failed: ${error.message}`);

      return (
        data as {
          article_url: string;
          normalized_title: string;
          source_name: string;
          published_at: string;
        }[]
      ).map((row) => ({
        articleUrl: row.article_url,
        normalizedTitle: row.normalized_title,
        sourceName: row.source_name,
        publishedAt: new Date(row.published_at).toISOString(),
      }));
    },

    async insertMany(
      articles: ValidatedNewArticle[],
    ): Promise<InsertResult> {
      if (articles.length === 0) {
        return { inserted: 0, duplicate: 0, failed: 0 };
      }

      const supabase = getClient();
      const urls = articles.map((article) => article.articleUrl);
      const existingUrls = await this.findExistingUrls(urls);

      const fresh = articles.filter(
        (article) => !existingUrls.has(article.articleUrl),
      );

      let inserted = 0;
      let failed = 0;
      let duplicate = articles.length - fresh.length;

      if (fresh.length > 0) {
        const { data, error } = await supabase
          .from(TABLE)
          .insert(fresh.map(toRow))
          .select('article_url');

        if (error) {
          if (error.code === UNIQUE_VIOLATION) {
            // A concurrent run inserted the same URL — not a failure.
            duplicate += fresh.length;
          } else {
            failed += fresh.length;
          }
        } else {
          inserted = (data as { article_url: string }[]).length;
        }
      }

      await backfillMissingFields(supabase, articles, existingUrls);

      return { inserted, duplicate, failed };
    },

    async count(): Promise<number> {
      const { count, error } = await getClient()
        .from(TABLE)
        .select('id', { count: 'exact', head: true });
      if (error) throw new Error(`Count failed: ${error.message}`);
      return count ?? 0;
    },

    async deleteAll(): Promise<void> {
      const { error } = await getClient()
        .from(TABLE)
        .delete()
        .not('id', 'is', null);
      if (error) throw new Error(`Delete failed: ${error.message}`);
    },

    async acquireLock(name: string, ttlMs: number): Promise<boolean> {
      const supabase = getClient();
      const now = new Date();

      // Clear any lock left behind by a run that died before releasing.
      await supabase
        .from(LOCK_TABLE)
        .delete()
        .eq('name', name)
        .lt('expires_at', now.toISOString());

      const { error } = await supabase.from(LOCK_TABLE).insert({
        name,
        expires_at: new Date(now.getTime() + ttlMs).toISOString(),
      });

      if (error) {
        if (error.code === UNIQUE_VIOLATION) return false;
        throw new Error(`Could not acquire lock: ${error.message}`);
      }
      return true;
    },

    async releaseLock(name: string): Promise<void> {
      await getClient().from(LOCK_TABLE).delete().eq('name', name);
    },
  };
}

/**
 * Fills columns that are null on an existing row when the new payload has a
 * value for them. Never replaces a stored value.
 */
async function backfillMissingFields(
  supabase: SupabaseClient,
  articles: ValidatedNewArticle[],
  existingUrls: Set<string>,
): Promise<void> {
  const candidates = articles.filter(
    (article) =>
      existingUrls.has(article.articleUrl) &&
      (article.description || article.imageUrl || article.sourceUrl),
  );
  if (candidates.length === 0) return;

  const { data, error } = await supabase
    .from(TABLE)
    .select('id,article_url,description,image_url,source_url,relevance_score')
    .in(
      'article_url',
      candidates.map((article) => article.articleUrl),
    );

  if (error || !data) return;

  const rows = data as {
    id: string;
    article_url: string;
    description: string | null;
    image_url: string | null;
    source_url: string | null;
    relevance_score: number | string;
  }[];
  const byUrl = new Map(rows.map((row) => [row.article_url, row]));

  for (const candidate of candidates) {
    const row = byUrl.get(candidate.articleUrl);
    if (!row) continue;

    const patch: Record<string, unknown> = {};
    if (!row.description && candidate.description) {
      patch.description = candidate.description;
    }
    if (!row.image_url && candidate.imageUrl) {
      patch.image_url = candidate.imageUrl;
    }
    if (!row.source_url && candidate.sourceUrl) {
      patch.source_url = candidate.sourceUrl;
    }
    if (candidate.relevanceScore > (Number(row.relevance_score) || 0)) {
      patch.relevance_score = candidate.relevanceScore;
    }
    if (Object.keys(patch).length === 0) continue;

    await supabase.from(TABLE).update(patch).eq('id', row.id);
  }
}
