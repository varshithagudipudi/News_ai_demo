import { describe, expect, it } from 'vitest';
import { mapProviderArticle } from '@/lib/news/collectNews';
import type { GNewsArticle } from '@/lib/news/gnewsClient';

const now = new Date('2026-01-15T12:00:00.000Z');
const windowStart = new Date('2026-01-12T12:00:00.000Z');

function providerArticle(
  overrides: Partial<GNewsArticle> = {},
): GNewsArticle {
  return {
    title: 'Generative AI startup ships a new model - TechCrunch',
    description: 'The company said the model improves inference speed.',
    content: null,
    url: 'https://techcrunch.com/story?utm_source=feed',
    image: 'https://techcrunch.com/image.jpg',
    publishedAt: '2026-01-14T09:00:00Z',
    source: { name: 'TechCrunch', url: 'https://techcrunch.com' },
    ...overrides,
  };
}

describe('mapProviderArticle', () => {
  it('maps a good provider record into a storable article', () => {
    const { article, skipReason } = mapProviderArticle(
      providerArticle(),
      'generative-ai',
      windowStart,
      now,
    );

    expect(skipReason).toBeUndefined();
    expect(article).not.toBeNull();
    expect(article?.articleUrl).toBe('https://techcrunch.com/story');
    expect(article?.normalizedTitle).toBe(
      'generative ai startup ships a new model',
    );
    expect(article?.category).toBe('generative-ai');
    expect(article?.provider).toBe('gnews');
    expect(article?.relevanceScore).toBeGreaterThan(0);
  });

  it('rejects a record with no title', () => {
    const result = mapProviderArticle(
      providerArticle({ title: '   ' }),
      'generative-ai',
      windowStart,
      now,
    );
    expect(result.article).toBeNull();
    expect(result.skipReason).toBe('missing title');
  });

  it('rejects an unparseable publication date', () => {
    const result = mapProviderArticle(
      providerArticle({ publishedAt: 'yesterday' }),
      'generative-ai',
      windowStart,
      now,
    );
    expect(result.article).toBeNull();
    expect(result.skipReason).toContain('publication date');
  });

  it('rejects an article URL that is not http(s)', () => {
    const result = mapProviderArticle(
      providerArticle({ url: 'javascript:alert(1)' }),
      'generative-ai',
      windowStart,
      now,
    );
    expect(result.article).toBeNull();
    expect(result.skipReason).toBe('invalid article URL');
  });

  it('upgrades an http article URL to https', () => {
    const result = mapProviderArticle(
      providerArticle({ url: 'http://techcrunch.com/story' }),
      'generative-ai',
      windowStart,
      now,
    );
    expect(result.article?.articleUrl).toBe('https://techcrunch.com/story');
  });

  it('drops an unusable image rather than the whole article', () => {
    const result = mapProviderArticle(
      providerArticle({ image: 'not-a-url' }),
      'generative-ai',
      windowStart,
      now,
    );
    expect(result.article).not.toBeNull();
    expect(result.article?.imageUrl).toBeNull();
  });

  it('rejects clearly unrelated content', () => {
    const result = mapProviderArticle(
      providerArticle({
        title: 'Premier League match preview and live score updates',
        description: 'Kick-off is at 8pm.',
      }),
      'generative-ai',
      windowStart,
      now,
    );
    expect(result.article).toBeNull();
  });

  it('truncates an over-long description', () => {
    const result = mapProviderArticle(
      providerArticle({ description: 'inference speed. '.repeat(200) }),
      'generative-ai',
      windowStart,
      now,
    );
    expect(result.article?.description?.length).toBeLessThanOrEqual(600);
  });
});
