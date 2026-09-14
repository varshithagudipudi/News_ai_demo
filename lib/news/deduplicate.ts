import type { ArticleFingerprint } from '@/lib/db/repository';
import type { ValidatedNewArticle } from '@/lib/validation/article';

/**
 * Two-stage duplicate detection.
 *
 * 1. Canonical article URL — the authoritative check.
 * 2. Identical or nearly identical normalized headlines across publishers,
 *    within a 48-hour publication window. Keeps the first matching article.
 */

/** How far apart two publication dates may be and still count as the same story. */
export const TITLE_MATCH_WINDOW_MS = 48 * 60 * 60 * 1000;

export interface DedupeResult {
  unique: ValidatedNewArticle[];
  duplicates: ValidatedNewArticle[];
}

const HEADLINE_STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'for', 'of', 'to', 'in', 'on', 'with',
  'its', 'by', 'as', 'at', 'from', 'new', 'today',
]);

// Deliberately narrow equivalents: do not conflate plans, reports or denials
// with completed events, or unrelated actions about the same company.
const HEADLINE_EQUIVALENTS: Record<string, string> = {
  launches: 'launch', launched: 'launch', launch: 'launch',
  unveils: 'launch', unveiled: 'launch', introduces: 'launch', introduced: 'launch',
  releases: 'launch', released: 'launch',
  raises: 'raise', raised: 'raise', secures: 'raise', secured: 'raise',
  buys: 'acquire', acquires: 'acquire', acquired: 'acquire',
};

function storyWords(words: Set<string>): Set<string> {
  return new Set([...words]
    .filter((word) => !HEADLINE_STOP_WORDS.has(word))
    .map((word) => HEADLINE_EQUIVALENTS[word] ?? word));
}

function headlinesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;

  const left = new Set(a.split(/\s+/));
  const right = new Set(b.split(/\s+/));

  // Preserve different amounts, dates, and model versions.
  const numberTokens = (words: Set<string>) =>
    [...words]
      .filter((word) => /\d/.test(word))
      .sort()
      .join(' ');

  if (numberTokens(left) !== numberTokens(right)) return false;

  // Small wording changes can reverse a headline's meaning.
  const sensitiveWords = [
    'not', 'no', 'never', 'denies', 'denied',
    'reportedly', 'rumor', 'rumors', 'may', 'might', 'could',
    'plans', 'planned', 'planning', 'considers', 'considering', 'will',
    'can', 'cannot', 'fails', 'failed', 'without',
  ];

  if (
    sensitiveWords.some((word) => left.has(word) !== right.has(word))
  ) {
    return false;
  }

  const shared = [...left].filter((word) => right.has(word)).length;

  // Require every word from the shorter headline and at least 90% overlap.
  if (
    Math.min(left.size, right.size) >= 8 &&
    shared === Math.min(left.size, right.size) &&
    shared / Math.max(left.size, right.size) >= 0.9
  ) return true;

  const leftStory = storyWords(left);
  const rightStory = storyWords(right);
  const shorter = Math.min(leftStory.size, rightStory.size);
  const longer = Math.max(leftStory.size, rightStory.size);
  const sharedStory = [...leftStory].filter((word) => rightStory.has(word)).length;

  // Require all meaningful words in the shorter title. Allow limited extra
  // context, but never merge merely because two stories share a company/topic.
  return shorter >= 4 && sharedStory === shorter && sharedStory / longer >= 0.8;
}

export function deduplicate<T extends ArticleFingerprint = ValidatedNewArticle>(
  candidates: T[],
  existing: ArticleFingerprint[],
): { unique: T[]; duplicates: T[] } {
  const seenUrls = new Set(existing.map((item) => item.articleUrl));

  const seenTitles = new Map<string, number[]>();
  for (const item of existing) {
    const key = item.normalizedTitle;
    const timestamps = seenTitles.get(key) ?? [];
    timestamps.push(new Date(item.publishedAt).getTime());
    seenTitles.set(key, timestamps);
  }

  const unique: T[] = [];
  const duplicates: T[] = [];

  for (const candidate of candidates) {
    if (seenUrls.has(candidate.articleUrl)) {
      duplicates.push(candidate);
      continue;
    }
    const key = candidate.normalizedTitle;
    const publishedAt = new Date(candidate.publishedAt).getTime();
    const timestamps = seenTitles.get(key) ?? [];
    const nearDuplicate = [...seenTitles].some(
      ([storedTitle, dates]) =>
        headlinesMatch(key, storedTitle) &&
        dates.some(
          (timestamp) =>
            Math.abs(timestamp - publishedAt) <= TITLE_MATCH_WINDOW_MS,
        ),
    );

    if (nearDuplicate) {
      duplicates.push(candidate);
      continue;
    }

    // Record it so later candidates in the same batch dedupe against it too.
    seenUrls.add(candidate.articleUrl);
    timestamps.push(publishedAt);
    seenTitles.set(key, timestamps);
    unique.push(candidate);
  }

  return { unique, duplicates };
}
