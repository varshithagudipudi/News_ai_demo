import './loadEnv';
import { mkdir, writeFile } from 'node:fs/promises';
import { getRepository } from '../lib/db/index';
import { createSemanticDeduplicator } from '../lib/news/semanticDeduplicate';
import { getEnv } from '../lib/config/env';

const repository = getRepository();
if (!getEnv().AI_DEDUP_ENABLED || !getEnv().GEMINI_API_KEY) {
  throw new Error('Set AI_DEDUP_ENABLED=true and GEMINI_API_KEY in .env.local before semantic preview.');
}

// Read all stored news, including older records awaiting retention cleanup.
const articles = await repository.findRecentFingerprints(
  '1970-01-01T00:00:00.000Z',
);

// Keep the earliest published matching article.
// Fingerprints don't contain collectedAt, so this is not insertion order.
articles.sort(
  (a, b) =>
    Date.parse(a.publishedAt) - Date.parse(b.publishedAt) ||
    a.articleUrl.localeCompare(b.articleUrl),
);

const deduper = createSemanticDeduplicator({ maxChecks: 1500, maxDurationMs: 30 * 60 * 1000 });
console.log(`Reviewing ${articles.length} articles; semantic API checks may take several minutes.`);
const { unique, duplicates, matches } = await deduper.deduplicate(articles, []);

await mkdir('.data', { recursive: true });

await writeFile(
  '.data/duplicate-preview.json',
  JSON.stringify(
    {
      total: articles.length,
      retainedCount: unique.length,
      duplicateCount: duplicates.length,
      complete: deduper.warnings.size === 0,
      warnings: [...deduper.warnings],
      matches,
      retained: unique,
      proposedDeletions: duplicates,
    },
    null,
    2,
  ),
);

console.log(`Scanned: ${articles.length}`);
console.log(`Keep: ${unique.length}`);
console.log(`Proposed deletions: ${duplicates.length}`);
console.log('Review .data/duplicate-preview.json. Nothing was deleted.');
for (const warning of deduper.warnings) console.warn(warning);
