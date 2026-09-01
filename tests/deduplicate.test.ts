import { describe, expect, it } from 'vitest';
import { deduplicate } from '@/lib/news/deduplicate';
import type { ArticleFingerprint } from '@/lib/db/repository';
import { normalizeTitle } from '@/lib/news/normalize';
import type { ValidatedNewArticle } from '@/lib/validation/article';

function candidate(
  overrides: Partial<ValidatedNewArticle> = {},
): ValidatedNewArticle {
  const title = overrides.title ?? 'Startup raises Series A for AI tooling';
  return {
    title,
    normalizedTitle: overrides.normalizedTitle ?? normalizeTitle(title),
    description: null,
    category: 'funding',
    imageUrl: null,
    sourceName: 'Example News',
    sourceUrl: null,
    articleUrl: 'https://example.com/a',
    publishedAt: '2026-01-12T00:00:00.000Z',
    relevanceScore: 50,
    isFeatured: false,
    provider: 'gnews',
    providerArticleId: null,
    rawMetadata: null,
    ...overrides,
  };
}

function fingerprint(
  overrides: Partial<ArticleFingerprint> = {},
): ArticleFingerprint {
  const title = 'Startup raises Series A for AI tooling';
  return {
    articleUrl: 'https://example.com/a',
    normalizedTitle: normalizeTitle(title),
    sourceName: 'Example News',
    publishedAt: '2026-01-12T00:00:00.000Z',
    ...overrides,
  };
}

describe('deduplicate', () => {
  it('keeps genuinely new articles', () => {
    const result = deduplicate([candidate()], []);
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });

  it('drops an article whose canonical URL is already stored', () => {
    const result = deduplicate([candidate()], [fingerprint()]);
    expect(result.unique).toHaveLength(0);
    expect(result.duplicates).toHaveLength(1);
  });

  it('drops the same headline from the same source at a different URL', () => {
    const result = deduplicate(
      [candidate({ articleUrl: 'https://example.com/a-different-path' })],
      [fingerprint()],
    );
    expect(result.unique).toHaveLength(0);
    expect(result.duplicates).toHaveLength(1);
  });

  it('keeps the same headline from a different publisher', () => {
    const result = deduplicate(
      [
        candidate({
          articleUrl: 'https://other.com/story',
          sourceName: 'Other News',
        }),
      ],
      [fingerprint()],
    );
    expect(result.unique).toHaveLength(1);
  });

  it('keeps a matching headline published well outside the match window', () => {
    const result = deduplicate(
      [
        candidate({
          articleUrl: 'https://example.com/rerun',
          publishedAt: '2026-02-20T00:00:00.000Z',
        }),
      ],
      [fingerprint()],
    );
    expect(result.unique).toHaveLength(1);
  });

  it('deduplicates within a single batch', () => {
    const result = deduplicate(
      [
        candidate(),
        candidate({ articleUrl: 'https://example.com/a' }),
        candidate({ articleUrl: 'https://example.com/b' }),
      ],
      [],
    );
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(2);
  });

  it('running the same batch twice inserts nothing the second time', () => {
    const batch = [candidate(), candidate({ articleUrl: 'https://x.com/1' })];

    const first = deduplicate(batch, []);
    const existing: ArticleFingerprint[] = first.unique.map((article) => ({
      articleUrl: article.articleUrl,
      normalizedTitle: article.normalizedTitle,
      sourceName: article.sourceName,
      publishedAt: article.publishedAt,
    }));

    const second = deduplicate(batch, existing);
    expect(second.unique).toHaveLength(0);
  });
});
