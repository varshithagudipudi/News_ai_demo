import { z } from 'zod';
import {
  ALL_CATEGORY_SLUG,
  categorySlugs,
  storableCategorySlugs,
} from '@/lib/config/categories';
import { siteConfig } from '@/lib/config/site';

/** Field length ceilings applied before anything is written to the database. */
export const FIELD_LIMITS = {
  title: 300,
  description: 600,
  sourceName: 120,
  url: 2048,
} as const;

const httpsUrl = z
  .string()
  .trim()
  .max(FIELD_LIMITS.url)
  .url()
  .refine((value) => {
    try {
      return new URL(value).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL must use https');

/** Accepts http or https; used where a publisher homepage may still be http. */
const webUrl = z
  .string()
  .trim()
  .max(FIELD_LIMITS.url)
  .url()
  .refine((value) => {
    try {
      const protocol = new URL(value).protocol;
      return protocol === 'https:' || protocol === 'http:';
    } catch {
      return false;
    }
  }, 'URL must use http or https');

/**
 * Shape an article must satisfy before it can be stored. Deliberately strict:
 * a record missing a title, a real publication date or an https article URL is
 * rejected rather than repaired.
 */
export const newArticleSchema = z.object({
  title: z.string().trim().min(8).max(FIELD_LIMITS.title),
  normalizedTitle: z.string().trim().min(1),
  description: z
    .string()
    .trim()
    .max(FIELD_LIMITS.description)
    .nullable()
    .default(null),
  category: z.enum(storableCategorySlugs as [string, ...string[]]),
  imageUrl: httpsUrl.nullable().default(null),
  sourceName: z.string().trim().min(1).max(FIELD_LIMITS.sourceName),
  sourceUrl: webUrl.nullable().default(null),
  articleUrl: httpsUrl,
  publishedAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime()),
  relevanceScore: z.number().int().min(0).max(100).default(0),
  isFeatured: z.boolean().default(false),
  provider: z.string().trim().min(1).max(50),
  providerArticleId: z.string().trim().max(255).nullable().default(null),
  rawMetadata: z.record(z.unknown()).nullable().default(null),
});

export type ValidatedNewArticle = z.infer<typeof newArticleSchema>;

/** Query parameters accepted by GET /api/articles. */
export const articleQuerySchema = z.object({
  category: z
    .enum(categorySlugs as [string, ...string[]])
    .default(ALL_CATEGORY_SLUG),
  search: z
    .string()
    .trim()
    .max(120)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable()
    .default(null),
  sort: z.enum(['newest', 'oldest']).default('newest'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(siteConfig.maxPageSize)
    .default(siteConfig.defaultPageSize),
  startDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime())
    .nullable()
    .default(null),
  endDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().datetime())
    .nullable()
    .default(null),
});

export type ParsedArticleQuery = z.infer<typeof articleQuerySchema>;

/** Parses URLSearchParams, ignoring empty strings so `?search=` behaves. */
export function parseArticleQuery(searchParams: URLSearchParams) {
  const raw: Record<string, string> = {};
  for (const key of [
    'category',
    'search',
    'sort',
    'page',
    'limit',
    'startDate',
    'endDate',
  ]) {
    const value = searchParams.get(key);
    if (value !== null && value.trim() !== '') {
      raw[key] = value;
    }
  }
  return articleQuerySchema.safeParse(raw);
}
