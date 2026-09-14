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
  it.each([
    ['OpenAI launches new AI tools for developers', 'OpenAI unveils AI tools for developers today'],
    ['Anthropic raises $500 million in funding', 'Anthropic secures $500 million funding'],
    ['Microsoft acquires AI startup Acme', 'Microsoft buys the AI startup Acme'],
  ])('matches publisher wording variations: %s', (first, second) => {
    const articles = [
      candidate({ title: first }),
      candidate({ title: second, sourceName: 'Other News', articleUrl: 'https://other.com/story' }),
    ];
    expect(deduplicate(articles, []).unique).toEqual([articles[0]]);
    expect(deduplicate([articles[1]], [articles[0]]).duplicates).toEqual([articles[1]]);
  });

  it.each([
    ['OpenAI launches AI tools for developers', 'Google launches AI tools for developers'],
    ['OpenAI launches AI tools for developers', 'OpenAI launches AI tools for teachers'],
    ['Anthropic raises $500 million funding', 'Anthropic raises $600 million funding'],
    ['OpenAI launches AI tools for developers', 'OpenAI reportedly launches AI tools for developers'],
    ['OpenAI launches AI tools for developers', 'OpenAI will launch AI tools for developers'],
    ['OpenAI launches model', 'OpenAI unveils model'],
  ])('preserves distinct or uncertain stories: %s / %s', (first, second) => {
    const articles = [
      candidate({ title: first }),
      candidate({ title: second, articleUrl: 'https://other.com/story' }),
    ];
    expect(deduplicate(articles, []).unique).toEqual(articles);
  });

  it('keeps reworded stories outside the publication window', () => {
    const articles = [
      candidate({ title: 'OpenAI launches AI tools for developers' }),
      candidate({
        title: 'OpenAI unveils AI tools for developers',
        articleUrl: 'https://other.com/story',
        publishedAt: '2026-01-14T00:00:00.001Z',
      }),
    ];
    expect(deduplicate(articles, []).unique).toEqual(articles);
  });

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

  it('drops the same headline from a different publisher', () => {
  const result = deduplicate(
    [
      candidate({
        articleUrl: 'https://other.com/story',
        sourceName: 'Other News',
      }),
    ],
    [fingerprint()],
  );

  expect(result.unique).toHaveLength(0);
  expect(result.duplicates).toHaveLength(1);
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

  it('keeps distinct stories about the same company', () => {
    const result = deduplicate(
      [candidate({
        title: 'OpenAI announces a new office in London',
        articleUrl: 'https://other.com/office',
        sourceName: 'Other News',
      })],
      [fingerprint({
        normalizedTitle: normalizeTitle('OpenAI announces a new model for developers'),
      })],
    );
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });

  it('drops a matching headline exactly 48 hours later', () => {
    const result = deduplicate(
      [candidate({
        articleUrl: 'https://other.com/story',
        sourceName: 'Other News',
        publishedAt: '2026-01-14T00:00:00.000Z',
      })],
      [fingerprint()],
    );
    expect(result.unique).toHaveLength(0);
    expect(result.duplicates).toHaveLength(1);
  });

  it('keeps a matching headline just beyond 48 hours', () => {
    const result = deduplicate(
      [candidate({
        articleUrl: 'https://other.com/story',
        sourceName: 'Other News',
        publishedAt: '2026-01-14T00:00:00.001Z',
      })],
      [fingerprint()],
    );
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });

  it('drops a small headline addition across publishers', () => {
    const result = deduplicate(
      [candidate({
        title: 'OpenAI launches new tools for developers building enterprise AI applications today',
        articleUrl: 'https://other.com/tools',
        sourceName: 'Other News',
      })],
      [fingerprint({
        normalizedTitle: normalizeTitle(
          'OpenAI launches new tools for developers building enterprise AI applications',
        ),
      })],
    );
    expect(result.unique).toHaveLength(0);
    expect(result.duplicates).toHaveLength(1);
  });

  it('keeps headlines with different model versions', () => {
    const result = deduplicate(
      [candidate({
        title: 'OpenAI launches model 5 for developers building enterprise AI applications',
        articleUrl: 'https://other.com/model',
      })],
      [fingerprint({
        normalizedTitle: normalizeTitle(
          'OpenAI launches model 4 for developers building enterprise AI applications',
        ),
      })],
    );
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });

  it('keeps headlines when an added word reverses the meaning', () => {
    const result = deduplicate(
      [candidate({
        title: 'OpenAI will not release new tools for developers building enterprise applications',
        articleUrl: 'https://other.com/update',
      })],
      [fingerprint({
        normalizedTitle: normalizeTitle(
          'OpenAI will release new tools for developers building enterprise applications',
        ),
      })],
    );
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(0);
  });
});
