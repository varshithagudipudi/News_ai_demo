import type { ArticleFingerprint } from '@/lib/db/repository';
import type { ValidatedNewArticle } from '@/lib/validation/article';

/**
 * Two-stage duplicate detection.
 *
 * 1. Canonical article URL — the authoritative check.
 * 2. Normalized title + publisher, within a short window of the publication
 *    date. Catches the same story re-published under a new URL.
 */

/** How far apart two publication dates may be and still count as the same story. */
export const TITLE_MATCH_WINDOW_MS = 48 * 60 * 60 * 1000;

export interface DedupeResult {
  unique: ValidatedNewArticle[];
  duplicates: ValidatedNewArticle[];
}

function titleKey(normalizedTitle: string): string {
  return normalizedTitle;
}

export function deduplicate(
  candidates: ValidatedNewArticle[],
  existing: ArticleFingerprint[],
): DedupeResult {
  const seenUrls = new Set(existing.map((item) => item.articleUrl));

  const seenTitles = new Map<string, number[]>();
  for (const item of existing) {
    const key = titleKey(item.normalizedTitle);
    const timestamps = seenTitles.get(key) ?? [];
    timestamps.push(new Date(item.publishedAt).getTime());
    seenTitles.set(key, timestamps);
  }

  const unique: ValidatedNewArticle[] = [];
  const duplicates: ValidatedNewArticle[] = [];

  for (const candidate of candidates) {
    if (seenUrls.has(candidate.articleUrl)) {
      duplicates.push(candidate);
      continue;
    }

    const key = titleKey(candidate.normalizedTitle);
    const publishedAt = new Date(candidate.publishedAt).getTime();
    const timestamps = seenTitles.get(key) ?? [];

    const nearDuplicate = timestamps.some(
      (timestamp) =>
        Math.abs(timestamp - publishedAt) <= TITLE_MATCH_WINDOW_MS,
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
