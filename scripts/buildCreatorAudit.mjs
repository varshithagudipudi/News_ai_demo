import { readFile, writeFile } from 'node:fs/promises';

const profiles = JSON.parse(await readFile('lib/config/creatorProfiles.json', 'utf8'));
const memberships = JSON.parse(await readFile('lib/config/creatorMemberships.json', 'utf8'));
const checks = JSON.parse(await readFile('.data/creator-link-check.json', 'utf8'));
const used = new Set(Object.values(memberships).flat());
const audit = profiles.filter((profile) => used.has(profile.id)).map((profile) => {
  const check = checks.find((entry) => entry.id === profile.id && entry.url === profile.url);
  if (!check) throw new Error(`Missing current link check: ${profile.id}`);
  const browserChecked = profile.id === 'chrisbishop';
  if (check.status !== 200 && !browserChecked) throw new Error(`Unresolved link: ${profile.id}`);
  return {
    id: profile.id, name: profile.name, url: profile.url,
    checkedAt: check.checkedAt,
    method: browserChecked ? 'Primary page opened with web browser tool' : 'HTTP fetch and page-title review',
    pageTitle: browserChecked ? 'Deep Learning - Foundations and Concepts' : check.title,
    httpStatus: check.status,
    note: browserChecked ? 'Automated fetch returned 403; primary book page was accessible through browser retrieval.'
      : profile.id === 'tldr' ? 'Primary newsletter page additionally opened in browser retrieval; title absent from HTML.' : '',
  };
});
await writeFile('docs/creator-link-audit.json', JSON.stringify(audit, null, 2) + '\n');
console.log(`Saved source checks for ${audit.length} unique directory profiles.`);
