import './loadEnv';
// Load the repository's Node WebSocket compatibility setup before the cache.
import '../lib/db/index';
import { getEnv } from '../lib/config/env';
import { createSemanticServices, semanticFailureReason } from '../lib/news/semanticDeduplicate';

// Two tiny synthetic requests; no article deletion or full database scan.
async function main() {
  if (!getEnv().GEMINI_API_KEY) {
    console.log('GEMINI_API_KEY is missing. Add it to .env.local.');
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes('--list-models')) {
    let pageToken = '';
    do {
      const url = new URL('https://generativelanguage.googleapis.com/v1beta/models');
      url.searchParams.set('pageSize', '1000');
      if (pageToken) url.searchParams.set('pageToken', pageToken);
      const response = await fetch(url, {
        headers: { 'x-goog-api-key': getEnv().GEMINI_API_KEY! },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`Gemini API returned ${response.status}`);
      const payload = await response.json() as {
        models?: { name: string; supportedGenerationMethods?: string[] }[];
        nextPageToken?: string;
      };
      for (const model of payload.models ?? []) {
        if (model.supportedGenerationMethods?.includes('generateContent') && /^models\/gemini-[a-z0-9.-]+$/.test(model.name))
          console.log(model.name.replace('models/', ''));
      }
      pageToken = payload.nextPageToken ?? '';
    } while (pageToken);
    return;
  }
  const services = createSemanticServices();
  const article = {
    title: 'Example company announces an AI tool',
    normalizedTitle: 'example company announces an ai tool',
    description: 'Example company announced its first AI writing tool today.',
    publishedAt: '2026-09-09T00:00:00Z',
    articleUrl: 'https://example.com/semantic-connection-check', sourceName: 'Example',
  };
  console.log('Checking embeddings and cache...');
  const vector = await services.embed(article);
  console.log(`Embedding and cache OK (${vector.length} dimensions).`);
  console.log('Checking event confirmation...');
  const decision = await services.confirm(article, article);
  console.log(`Event confirmation OK (${decision.decision}).`);
}
main().catch((error: unknown) => {
  console.error(semanticFailureReason(error));
  process.exitCode = 1;
});
