import 'server-only';
import { randomUUID } from 'node:crypto';
import { enrichArticle } from '@/lib/ai/enrichArticle';
import { collectableCategories } from '@/lib/config/categories';
import { getEnv, isAiEnrichmentEnabled } from '@/lib/config/env';
import { getRepository } from '@/lib/db';
import { deduplicate } from '@/lib/news/deduplicate';
import { searchNews, type GNewsArticle } from '@/lib/news/gnewsClient';
import {
  normalizeTitle,
  normalizeUrl,
  parsePublishedAt,
  preferHttps,
  sanitizeText,
  truncate,
} from '@/lib/news/normalize';
import { scoreArticle } from '@/lib/news/relevance';
import type {
  CategoryRunSummary,
  CollectionSummary,
} from '@/lib/types/article';
import {
  FIELD_LIMITS,
  newArticleSchema,
  type ValidatedNewArticle,
} from '@/lib/validation/article';

export const COLLECTION_LOCK = 'collect-news';
/** Long enough for a full run, short enough that a crashed run self-heals. */
export const LOCK_TTL_MS = 5 * 60 * 1000;

const PROVIDER = 'gnews';

export class CollectionLockedError extends Error {
  constructor() {
    super('A collection run is already in progress.');
    this.name = 'CollectionLockedError';
  }
}

interface MapResult {
  article: ValidatedNewArticle | null;
  skipReason?: string;
}

/**
 * Maps one provider result into the internal schema, applying every
 * deterministic rule: required fields, https-only article URLs, sanitization,
 * truncation, URL/title normalization and relevance scoring.
 */
export function mapProviderArticle(
  raw: GNewsArticle,
  category: string,
  windowStart: Date,
  now: Date = new Date(),
): MapResult {
  const title = truncate(sanitizeText(raw.title), FIELD_LIMITS.title);
  if (!title) return { article: null, skipReason: 'missing title' };

  const publishedAt = parsePublishedAt(raw.publishedAt, now);
  if (!publishedAt) {
    return { article: null, skipReason: 'missing or invalid publication date' };
  }

  const canonicalUrl = normalizeUrl(raw.url);
  if (!canonicalUrl) return { article: null, skipReason: 'invalid article URL' };

  const articleUrl = preferHttps(canonicalUrl);
  if (!articleUrl.startsWith('https://')) {
    return { article: null, skipReason: 'article URL is not https' };
  }

  const description = truncate(
    sanitizeText(raw.description),
    FIELD_LIMITS.description,
  );
  const sourceName =
    truncate(sanitizeText(raw.source.name), FIELD_LIMITS.sourceName) ??
    'Unknown source';

  const imageCandidate = raw.image ? normalizeUrl(raw.image) : null;
  const imageUrl =
    imageCandidate && preferHttps(imageCandidate).startsWith('https://')
      ? preferHttps(imageCandidate)
      : null;

  const sourceCandidate = raw.source.url ? normalizeUrl(raw.source.url) : null;

  const score = scoreArticle({
    title,
    description,
    sourceName,
    category,
    publishedAt,
    windowStart,
  });

  if (!score.accepted) {
    return { article: null, skipReason: score.reasons.join('; ') };
  }

  const parsed = newArticleSchema.safeParse({
    title,
    normalizedTitle: normalizeTitle(title),
    description,
    category,
    imageUrl,
    sourceName,
    sourceUrl: sourceCandidate,
    articleUrl,
    publishedAt,
    relevanceScore: score.score,
    isFeatured: false,
    provider: PROVIDER,
    providerArticleId: null,
    rawMetadata: null,
  });

  if (!parsed.success) {
    return {
      article: null,
      skipReason: `schema: ${parsed.error.issues
        .map((issue) => issue.path.join('.'))
        .join(', ')}`,
    };
  }

  return { article: parsed.data };
}

/**
 * Runs one full collection cycle. Acquires a lock first; a category that fails
 * is recorded and the remaining categories still run.
 */
export async function collectNews(): Promise<CollectionSummary> {
  const repository = getRepository();
  const runId = randomUUID();
  const startedAt = new Date();

  const acquired = await repository.acquireLock(COLLECTION_LOCK, LOCK_TTL_MS);
  if (!acquired) throw new CollectionLockedError();

  try {
    const env = getEnv();
    const windowStart = new Date(
      startedAt.getTime() - env.COLLECT_MAX_AGE_HOURS * 60 * 60 * 1000,
    );

    const existing = await repository.findRecentFingerprints(
      new Date(
        windowStart.getTime() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );

    const perCategory: CategoryRunSummary[] = [];
    let enriched = 0;
    let enrichmentBudget = isAiEnrichmentEnabled()
      ? env.AI_MAX_ENRICHMENTS_PER_RUN
      : 0;

    for (const category of collectableCategories) {
      const summary: CategoryRunSummary = {
        category: category.slug,
        fetched: 0,
        inserted: 0,
        skipped: 0,
        duplicate: 0,
        failed: 0,
      };

      try {
        const raw = await searchNews({
          query: category.query,
          max: env.COLLECT_ARTICLES_PER_CATEGORY,
          from: windowStart.toISOString(),
        });
        summary.fetched = raw.length;

        const candidates: ValidatedNewArticle[] = [];
        for (const item of raw) {
          const mapped = mapProviderArticle(
            item,
            category.slug,
            windowStart,
            startedAt,
          );
          if (mapped.article) candidates.push(mapped.article);
          else summary.skipped += 1;
        }

        const { unique, duplicates } = deduplicate(candidates, existing);
        summary.duplicate = duplicates.length;

        // AI runs only on records that survived validation and deduplication.
        const finalArticles: ValidatedNewArticle[] = [];
        for (const article of unique) {
          if (enrichmentBudget <= 0) {
            finalArticles.push(article);
            continue;
          }

          const enrichment = await enrichArticle({
            title: article.title,
            description: article.description,
            sourceName: article.sourceName,
            category: article.category,
            articleUrl: article.articleUrl,
          });

          if (!enrichment) {
            finalArticles.push(article);
            continue;
          }

          enrichmentBudget -= 1;
          enriched += 1;

          if (!enrichment.isRelevant) {
            summary.skipped += 1;
            continue;
          }

          finalArticles.push({
            ...article,
            category: enrichment.category,
            description:
              truncate(
                sanitizeText(enrichment.summary),
                FIELD_LIMITS.description,
              ) ?? article.description,
            relevanceScore: Math.max(
              article.relevanceScore,
              enrichment.relevanceScore,
            ),
          });
        }

        const result = await repository.insertMany(finalArticles);
        summary.inserted = result.inserted;
        summary.duplicate += result.duplicate;
        summary.failed = result.failed;

        // Keep the in-memory fingerprint set current so the next category in
        // this same run does not re-insert the same story.
        for (const article of finalArticles) {
          existing.push({
            articleUrl: article.articleUrl,
            normalizedTitle: article.normalizedTitle,
            sourceName: article.sourceName,
            publishedAt: article.publishedAt,
          });
        }
      } catch (error) {
        summary.failed += 1;
        summary.error =
          error instanceof Error ? error.message : 'Unknown category error';
        console.error('[collect] category failed', {
          runId,
          category: category.slug,
          message: summary.error,
        });
      }

      perCategory.push(summary);
    }

    const finishedAt = new Date();
    const totals = perCategory.reduce(
      (acc, item) => ({
        fetched: acc.fetched + item.fetched,
        inserted: acc.inserted + item.inserted,
        skipped: acc.skipped + item.skipped,
        duplicate: acc.duplicate + item.duplicate,
        failed: acc.failed + item.failed,
      }),
      { fetched: 0, inserted: 0, skipped: 0, duplicate: 0, failed: 0 },
    );

    const result: CollectionSummary = {
      runId,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      ...totals,
      enriched,
      categories: perCategory,
    };

    console.log('[collect] run complete', {
      runId: result.runId,
      durationMs: result.durationMs,
      fetched: result.fetched,
      inserted: result.inserted,
      skipped: result.skipped,
      duplicate: result.duplicate,
      failed: result.failed,
      enriched: result.enriched,
      store: repository.name,
    });

    return result;
  } finally {
    await repository.releaseLock(COLLECTION_LOCK);
  }
}
