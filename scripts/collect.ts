/**
 * Runs one collection cycle from the command line, without going through the
 * HTTP endpoint. Requires GNEWS_API_KEY in .env.local.
 *
 *   npm run collect:local
 */

import './loadEnv';
import { collectNews } from '@/lib/news/collectNews';

async function main() {
  const summary = await collectNews();
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(
    'Collection failed:',
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
