/**
 * Development-only seed command.
 *
 * Inserts the local fixtures so the UI can be exercised without provider
 * credentials. It refuses to run when NODE_ENV is production, and it is never
 * invoked by the collection pipeline.
 *
 *   npm run db:seed
 *   npm run db:seed -- --reset
 */

import './loadEnv';
import { getRepository } from '@/lib/db';
import { fixtureArticles } from '@/lib/fixtures/articles';
import { normalizeTitle } from '@/lib/news/normalize';
import { newArticleSchema } from '@/lib/validation/article';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Refusing to seed fixtures in a production environment.');
    process.exit(1);
  }

  const repository = getRepository();
  const reset = process.argv.includes('--reset');

  if (reset) {
    await repository.deleteAll();
    console.log('Cleared existing articles.');
  }

  const now = Date.now();
  const articles = fixtureArticles.map((fixture) =>
    newArticleSchema.parse({
      title: fixture.title,
      normalizedTitle: normalizeTitle(fixture.title),
      description: fixture.description,
      category: fixture.category,
      imageUrl: fixture.imageUrl,
      sourceName: fixture.sourceName,
      sourceUrl: fixture.sourceUrl,
      articleUrl: fixture.articleUrl,
      publishedAt: new Date(
        now - fixture.publishedHoursAgo * 60 * 60 * 1000,
      ).toISOString(),
      relevanceScore: fixture.relevanceScore,
      isFeatured: false,
      provider: 'fixture',
      providerArticleId: null,
      rawMetadata: null,
    }),
  );

  const result = await repository.insertMany(articles);

  console.log(
    `Seeded ${result.inserted} article(s) into the "${repository.name}" store ` +
      `(${result.duplicate} already present, ${result.failed} failed). ` +
      `Total now: ${await repository.count()}.`,
  );
}

main().catch((error) => {
  console.error('Seed failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
