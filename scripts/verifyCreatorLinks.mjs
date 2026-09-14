import { readFile, writeFile, mkdir } from 'node:fs/promises';

const allProfiles = JSON.parse(await readFile('lib/config/creatorProfiles.json', 'utf8'));
const selected = process.argv.slice(2);
const profiles = selected.length ? allProfiles.filter((profile) => selected.includes(profile.id)) : allProfiles;
const results = [];
let next = 0;
async function worker() {
  while (next < profiles.length) {
    const profile = profiles[next++];
    try {
      const response = await fetch(profile.url, {
        signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AIPulseLinkCheck/1.0)' },
      });
      const html = await response.text();
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]
        .replace(/\s+/g, ' ').trim() ?? '';
      results.push({ id: profile.id, url: profile.url, status: response.status, finalUrl: response.url, title, checkedAt: new Date().toISOString() });
    } catch (error) {
      results.push({ id: profile.id, url: profile.url, status: 0, error: error.name, checkedAt: new Date().toISOString() });
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
await mkdir('.data', { recursive: true });
const previous = selected.length
  ? JSON.parse(await readFile('.data/creator-link-check.json', 'utf8').catch(() => '[]'))
      .filter((result) => !selected.includes(result.id))
  : [];
await writeFile('.data/creator-link-check.json', JSON.stringify([...previous, ...results], null, 2));
console.log(JSON.stringify(results.map(({ id, status, title }) => ({ id, status, title })), null, 2));
