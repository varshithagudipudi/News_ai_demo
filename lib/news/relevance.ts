import { getCategory } from '@/lib/config/categories';

/**
 * Deterministic relevance scoring. This runs before any AI call and is the
 * only gate that decides whether an article is stored at all.
 *
 * All weights live in RELEVANCE_WEIGHTS so they can be tuned without touching
 * the logic. Scores are clamped to 0-100.
 */

export const RELEVANCE_WEIGHTS = {
  /** Strong category phrase found in the title. */
  strongTitleTerm: 40,
  /** Strong category phrase found only in the description. */
  strongDescriptionTerm: 15,
  /** General AI/startup vocabulary in the description. */
  supportingTerm: 10,
  /** Cap on how much supporting vocabulary can contribute. */
  supportingTermCap: 20,
  /** Publisher is on the known-relevant list. */
  trustedSource: 10,
  /** Published inside the requested collection window. */
  withinWindow: 10,
  /** Baseline every candidate starts from. */
  base: 10,
  /** Below this an article is not stored. */
  acceptThreshold: 35,
} as const;

/** Vocabulary that supports (but does not by itself establish) relevance. */
export const SUPPORTING_TERMS = [
  'ai',
  'artificial intelligence',
  'machine learning',
  'neural',
  'model',
  'algorithm',
  'chatbot',
  'openai',
  'anthropic',
  'deepmind',
  'nvidia',
  'hugging face',
  'startup',
  'founder',
  'funding',
  'venture',
  'seed round',
  'series a',
  'valuation',
  'acquisition',
  'automation',
  'dataset',
  'gpu',
  'inference',
  'agent',
];

/** Publishers whose technology coverage is consistently on-topic. */
export const TRUSTED_SOURCES = [
  'techcrunch',
  'the verge',
  'wired',
  'ars technica',
  'venturebeat',
  'reuters',
  'bloomberg',
  'financial times',
  'the information',
  'mit technology review',
  'ieee spectrum',
  'axios',
  'cnbc',
  'business insider',
  'zdnet',
  'engadget',
  'the register',
  'analytics india magazine',
  'yourstory',
  'inc42',
  'economic times',
  'livemint',
];

/** Content that is never news, regardless of how many keywords it contains. */
export const REJECT_PATTERNS: RegExp[] = [
  /\b(hiring|we are hiring|job opening|job alert|apply now|vacanc(y|ies)|recruitment|walk-in interview|salary)\b/i,
  /\b(horoscope|astrology|lottery|jackpot|betting odds|casino)\b/i,
  /\b(match preview|full scorecard|live score|premier league|ipl \d{4}|transfer window|box office collection)\b/i,
  /\b(coupon|promo code|discount code|deal of the day|best deals|buy now|shop now|sponsored)\b/i,
  /\b(dating|weight loss|male enhancement|crypto giveaway|forex signals)\b/i,
];

/**
 * "AI" as a bare token is ambiguous — it appears in ticker symbols, Hindi and
 * Italian words, airline codes and initials. It only counts when the text also
 * carries supporting vocabulary.
 */
const BARE_AI = /\bai\b/i;

const AI_SUPPORTING_CONTEXT =
  /\b(artificial intelligence|machine learning|model|models|chatbot|llm|neural|algorithm|openai|anthropic|deepmind|generative|automation|agent|agents|copilot|inference|training|dataset|gpu|startup|funding)\b/i;

export interface ScoreInput {
  title: string;
  description: string | null;
  sourceName: string;
  category: string;
  publishedAt: string;
  /** Start of the acceptable publication window. */
  windowStart: Date;
}

export interface ScoreResult {
  score: number;
  accepted: boolean;
  /** Human-readable reasons, used in run logs when an article is dropped. */
  reasons: string[];
}

function includesTerm(haystack: string, term: string): boolean {
  return haystack.includes(term.toLowerCase());
}

export function isRejectedContent(text: string): boolean {
  return REJECT_PATTERNS.some((pattern) => pattern.test(text));
}

export function isTrustedSource(sourceName: string): boolean {
  const name = sourceName.toLowerCase();
  return TRUSTED_SOURCES.some((source) => name.includes(source));
}

/**
 * True when the text's only AI signal is a bare "AI" token with nothing else
 * to support it — the ambiguous case the spec says not to auto-accept.
 */
export function isAmbiguousAiMention(text: string): boolean {
  const hasAiToken = BARE_AI.test(text);
  if (!hasAiToken) return false;
  return !AI_SUPPORTING_CONTEXT.test(text);
}

export function scoreArticle(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];
  const title = input.title.toLowerCase();
  const description = (input.description ?? '').toLowerCase();
  const combined = `${title} ${description}`;

  if (isRejectedContent(combined)) {
    return {
      score: 0,
      accepted: false,
      reasons: ['matched a rejected-content pattern'],
    };
  }

  let score: number = RELEVANCE_WEIGHTS.base;

  const definition = getCategory(input.category);
  const strongTerms = definition?.strongTerms ?? [];

  const strongInTitle = strongTerms.some((term) => includesTerm(title, term));
  const strongInDescription = strongTerms.some((term) =>
    includesTerm(description, term),
  );

  if (strongInTitle) {
    score += RELEVANCE_WEIGHTS.strongTitleTerm;
    reasons.push('strong category phrase in title');
  } else if (strongInDescription) {
    score += RELEVANCE_WEIGHTS.strongDescriptionTerm;
    reasons.push('strong category phrase in description');
  }

  const supportingHits = SUPPORTING_TERMS.filter(
    (term) => term !== 'ai' && includesTerm(combined, term),
  ).length;

  if (supportingHits > 0) {
    const bonus = Math.min(
      supportingHits * RELEVANCE_WEIGHTS.supportingTerm,
      RELEVANCE_WEIGHTS.supportingTermCap,
    );
    score += bonus;
    reasons.push(`${supportingHits} supporting term(s)`);
  }

  if (isTrustedSource(input.sourceName)) {
    score += RELEVANCE_WEIGHTS.trustedSource;
    reasons.push('trusted source');
  }

  const publishedAt = new Date(input.publishedAt);
  if (publishedAt.getTime() >= input.windowStart.getTime()) {
    score += RELEVANCE_WEIGHTS.withinWindow;
    reasons.push('within collection window');
  } else {
    reasons.push('outside collection window');
  }

  score = Math.max(0, Math.min(100, score));

  // A bare, unsupported "AI" mention is never enough on its own.
  if (!strongInTitle && !strongInDescription && isAmbiguousAiMention(combined)) {
    return {
      score,
      accepted: false,
      reasons: [...reasons, 'ambiguous standalone "AI" mention'],
    };
  }

  return {
    score,
    accepted: score >= RELEVANCE_WEIGHTS.acceptThreshold,
    reasons,
  };
}
