import profiles from '@/lib/config/creatorProfiles.json';
import memberships from '@/lib/config/creatorMemberships.json';
import { creatorGroups, type CreatorGroupSlug } from '@/lib/config/creators';

export const directoryTopics = creatorGroups.map((group) => ({
  ...group,
  label: ({
    'ai-news-trends': 'AI News', 'ai-coding': 'Coding & Agents',
    'ai-tools-productivity': 'Tools & Productivity', 'ml-research': 'Research',
    'ai-business-startups': 'Business', 'prompt-engineering-no-code': 'Prompting & No-code',
  })[group.slug],
}));

// Editorial classifications of existing profiles, not platform credentials.
const publications = new Set('rundown bens latent neuron superhuman tldr lastweek aibreakdown hardfork distill towards kdn practicalai gradient aisnake firstround'.split(' '));
const education = new Set('deeplearning d2l camp learnprompt promptguide fullstack mlops datatalks'.split(' '));
const companies = new Set('trust a16z sequoia yc anthropic openaiacademy google hugging langchain llama n8n make zapier bubble retool voiceflow botpress flowise dify langflow gumloop lindy relevance mindstudio copilot stackai vellum promptlayer helicone braintrust arize weights lightning saa nfx bessemer convex vercel cursor replit lovable bolt notion airtable coda'.split(' '));
export const profileTypes = ['Individual creators', 'Publications & podcasts', 'Learning communities', 'Company resources'] as const;
export const contentFormats = ['Articles & analysis', 'Guides & tutorials', 'Interviews & conversations', 'Research & papers', 'Code & projects'] as const;
export type ProfileType = typeof profileTypes[number];
export type ContentFormat = typeof contentFormats[number];
export interface CreatorProfile {
  id: string; name: string; url: string; description: string;
  type: ProfileType; topics: CreatorGroupSlug[]; formats: ContentFormat[];
}

function formatsFor(description: string): ContentFormat[] {
  const formats: ContentFormat[] = [];
  if (/writing|essays|analysis|commentary|reporting|articles|news|perspectives|digest/i.test(description)) formats.push('Articles & analysis');
  if (/tutorial|guide|education|course|lesson|explanation|learning resources|teaching|walkthrough/i.test(description)) formats.push('Guides & tutorials');
  if (/interview|conversation|podcast/i.test(description)) formats.push('Interviews & conversations');
  if (/research|papers/i.test(description)) formats.push('Research & papers');
  if (/code|notebook|project|implementation|open-source|programming/i.test(description)) formats.push('Code & projects');
  return formats;
}
export const creatorProfiles: CreatorProfile[] = profiles.map((profile) => ({
  ...profile,
  type: publications.has(profile.id) ? 'Publications & podcasts'
    : education.has(profile.id) ? 'Learning communities'
      : companies.has(profile.id) ? 'Company resources' : 'Individual creators',
  topics: creatorGroups.filter((group) => memberships[group.slug].includes(profile.id)).map((group) => group.slug),
  formats: formatsFor(profile.description),
}));
export interface DirectoryFilters {
  query: string; topic: string; type: string; format: string; savedOnly: boolean; order: string;
}
export const emptyDirectoryFilters: DirectoryFilters = { query: '', topic: 'all', type: 'all', format: 'all', savedOnly: false, order: 'directory' };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function filterCreatorProfiles(filters: DirectoryFilters, savedIds: readonly string[] = []): CreatorProfile[] {
  const terms = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  const result = creatorProfiles.filter((profile) => {
    if (filters.topic !== 'all' && !profile.topics.some((topic) => topic === filters.topic)) return false;
    if (filters.type !== 'all' && profile.type !== filters.type) return false;
    if (filters.format !== 'all' && !profile.formats.some((format) => format === filters.format)) return false;
    if (filters.savedOnly && !savedIds.includes(profile.id)) return false;
    const haystack = normalize([profile.name, profile.description, profile.type, ...profile.formats,
      ...directoryTopics.filter((topic) => profile.topics.includes(topic.slug)).map((topic) => `${topic.name} ${topic.label}`),
    ].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
  return filters.order === 'name' ? result.sort((a, b) => a.name.localeCompare(b.name)) : result;
}
