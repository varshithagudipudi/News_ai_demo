import { describe, expect, it } from 'vitest';
import {
  RELEVANCE_WEIGHTS,
  isAmbiguousAiMention,
  isRejectedContent,
  isTrustedSource,
  scoreArticle,
  type ScoreInput,
} from '@/lib/news/relevance';

const windowStart = new Date('2026-01-10T00:00:00.000Z');

function input(overrides: Partial<ScoreInput> = {}): ScoreInput {
  return {
    title: 'Generative AI startup ships new model',
    description: 'The company said the model improves inference speed.',
    sourceName: 'Example News',
    category: 'generative-ai',
    publishedAt: '2026-01-12T00:00:00.000Z',
    windowStart,
    ...overrides,
  };
}

describe('scoreArticle', () => {
  it('accepts an article with a strong category phrase in the title', () => {
    const result = scoreArticle(input());
    expect(result.accepted).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(
      RELEVANCE_WEIGHTS.acceptThreshold,
    );
    expect(result.reasons).toContain('strong category phrase in title');
  });

  it('weights a title match above a description-only match', () => {
    const titleMatch = scoreArticle(input());
    const descriptionMatch = scoreArticle(
      input({
        title: 'Company ships a new product this quarter',
        description: 'The generative AI model improves inference speed.',
      }),
    );
    expect(titleMatch.score).toBeGreaterThan(descriptionMatch.score);
  });

  it('adds weight for a trusted source', () => {
    const untrusted = scoreArticle(input());
    const trusted = scoreArticle(input({ sourceName: 'TechCrunch' }));
    expect(trusted.score - untrusted.score).toBe(
      RELEVANCE_WEIGHTS.trustedSource,
    );
  });

  it('adds weight for publication inside the window', () => {
    const inside = scoreArticle(input());
    const outside = scoreArticle(
      input({ publishedAt: '2026-01-01T00:00:00.000Z' }),
    );
    expect(inside.score - outside.score).toBe(RELEVANCE_WEIGHTS.withinWindow);
    expect(outside.reasons).toContain('outside collection window');
  });

  it('caps the supporting-term bonus', () => {
    const result = scoreArticle(
      input({
        title: 'Generative AI startup ships new model',
        description:
          'openai anthropic deepmind nvidia funding venture seed round valuation acquisition gpu inference dataset',
      }),
    );
    const maximum =
      RELEVANCE_WEIGHTS.base +
      RELEVANCE_WEIGHTS.strongTitleTerm +
      RELEVANCE_WEIGHTS.supportingTermCap +
      RELEVANCE_WEIGHTS.withinWindow;
    expect(result.score).toBeLessThanOrEqual(maximum);
  });

  it('rejects job listings, sports and spam outright', () => {
    for (const title of [
      'We are hiring a machine learning engineer, apply now',
      'IPL 2026 live score and full scorecard',
      'Best deals: promo code for AI software, buy now',
    ]) {
      const result = scoreArticle(input({ title }));
      expect(result.accepted).toBe(false);
      expect(result.score).toBe(0);
    }
  });

  it('does not auto-accept an unsupported standalone "AI" mention', () => {
    const result = scoreArticle(
      input({
        title: 'AI wins the regional dance competition',
        description: 'The trophy was awarded on Sunday evening.',
        category: 'artificial-intelligence',
      }),
    );
    expect(result.accepted).toBe(false);
    expect(result.reasons).toContain('ambiguous standalone "AI" mention');
  });

  it('rejects an on-topic-looking article that scores below the threshold', () => {
    const result = scoreArticle(
      input({
        title: 'Local council approves new parking scheme',
        description: 'Residents will be consulted in the spring.',
        category: 'robotics',
        publishedAt: '2026-01-01T00:00:00.000Z',
      }),
    );
    expect(result.accepted).toBe(false);
  });
});

describe('helpers', () => {
  it('detects rejected content patterns', () => {
    expect(isRejectedContent('job opening for a data scientist')).toBe(true);
    expect(isRejectedContent('openai releases a new model')).toBe(false);
  });

  it('matches trusted sources case-insensitively', () => {
    expect(isTrustedSource('TechCrunch')).toBe(true);
    expect(isTrustedSource('The Verge')).toBe(true);
    expect(isTrustedSource('Unknown Blog')).toBe(false);
  });

  it('flags a bare AI token only without supporting context', () => {
    expect(isAmbiguousAiMention('AI takes the stage')).toBe(true);
    expect(isAmbiguousAiMention('AI model beats benchmark')).toBe(false);
    expect(isAmbiguousAiMention('robotics firm expands')).toBe(false);
  });
});
