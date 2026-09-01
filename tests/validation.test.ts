import { describe, expect, it } from 'vitest';
import {
  newArticleSchema,
  parseArticleQuery,
} from '@/lib/validation/article';
import { siteConfig } from '@/lib/config/site';

describe('parseArticleQuery', () => {
  function parse(query: string) {
    return parseArticleQuery(new URLSearchParams(query));
  }

  it('applies defaults for an empty query string', () => {
    const result = parse('');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toEqual({
      category: 'all',
      search: null,
      sort: 'newest',
      page: 1,
      limit: siteConfig.defaultPageSize,
    });
  });

  it('accepts a full valid query', () => {
    const result = parse('category=funding&search=series%20a&sort=oldest&page=3&limit=24');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.category).toBe('funding');
    expect(result.data.search).toBe('series a');
    expect(result.data.sort).toBe('oldest');
    expect(result.data.page).toBe(3);
    expect(result.data.limit).toBe(24);
  });

  it('treats an empty search parameter as no search', () => {
    const result = parse('search=');
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.search).toBeNull();
  });

  it('rejects an unknown category', () => {
    expect(parse('category=sports').success).toBe(false);
  });

  it('rejects an out-of-range limit and a non-numeric page', () => {
    expect(parse(`limit=${siteConfig.maxPageSize + 1}`).success).toBe(false);
    expect(parse('limit=0').success).toBe(false);
    expect(parse('page=abc').success).toBe(false);
    expect(parse('page=0').success).toBe(false);
  });

  it('rejects an unknown sort order', () => {
    expect(parse('sort=relevance').success).toBe(false);
  });
});

describe('newArticleSchema', () => {
  const valid = {
    title: 'A perfectly ordinary AI headline',
    normalizedTitle: 'a perfectly ordinary ai headline',
    description: 'Some description.',
    category: 'generative-ai',
    imageUrl: 'https://cdn.example.com/image.jpg',
    sourceName: 'Example News',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/story',
    publishedAt: '2026-01-12T00:00:00.000Z',
    relevanceScore: 60,
    isFeatured: false,
    provider: 'gnews',
    providerArticleId: null,
    rawMetadata: null,
  };

  it('accepts a well-formed record', () => {
    expect(newArticleSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects a non-https article URL', () => {
    expect(
      newArticleSchema.safeParse({
        ...valid,
        articleUrl: 'http://example.com/story',
      }).success,
    ).toBe(false);
  });

  it('rejects a javascript: URL', () => {
    expect(
      newArticleSchema.safeParse({
        ...valid,
        articleUrl: 'javascript:alert(1)',
      }).success,
    ).toBe(false);
  });

  it('rejects the `all` pseudo-category', () => {
    expect(
      newArticleSchema.safeParse({ ...valid, category: 'all' }).success,
    ).toBe(false);
  });

  it('rejects a missing publication date and an empty title', () => {
    expect(
      newArticleSchema.safeParse({ ...valid, publishedAt: '' }).success,
    ).toBe(false);
    expect(newArticleSchema.safeParse({ ...valid, title: '' }).success).toBe(
      false,
    );
  });

  it('allows a null image and applies defaults', () => {
    const result = newArticleSchema.safeParse({
      ...valid,
      imageUrl: null,
      relevanceScore: undefined,
      isFeatured: undefined,
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.relevanceScore).toBe(0);
    expect(result.data.isFeatured).toBe(false);
  });
});
