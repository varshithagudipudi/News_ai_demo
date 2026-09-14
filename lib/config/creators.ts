import profiles from './creatorProfiles.json';
import membershipData from './creatorMemberships.json';

/** Public creators and educational channels, curated by topic. */
export type CreatorGroupSlug =
  | 'ai-news-trends' | 'ai-coding' | 'ai-tools-productivity'
  | 'ml-research' | 'ai-business-startups' | 'prompt-engineering-no-code';

export interface CreatorGroupDefinition { slug: CreatorGroupSlug; name: string }
export const creatorGroups: CreatorGroupDefinition[] = [
  { slug: 'ai-news-trends', name: 'AI News & Trends' },
  { slug: 'ai-coding', name: 'AI Coding' },
  { slug: 'ai-tools-productivity', name: 'AI Tools & Productivity' },
  { slug: 'ml-research', name: 'Machine Learning Research' },
  { slug: 'ai-business-startups', name: 'AI Business & Startups' },
  { slug: 'prompt-engineering-no-code', name: 'Prompt Engineering / No-code AI' },
];

export interface Creator {
  name: string;
  realName: string;
  platform: string;
  url: string;
  focusAreas: string[];
  skillLevel: string;
  bestFor: string;
  description: string;
  group: CreatorGroupSlug;
}

const memberships: Record<CreatorGroupSlug, string[]> = membershipData;
const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
const groupDetails: Record<CreatorGroupSlug, { focusAreas: string[]; bestFor: string; skillLevel: string }> = {
  'ai-news-trends': { focusAreas: ['AI News', 'Analysis'], bestFor: 'Following developments and perspectives in AI', skillLevel: 'All Levels' },
  'ai-coding': { focusAreas: ['AI Engineering', 'Development'], bestFor: 'Learning to build and evaluate AI applications', skillLevel: 'Intermediate' },
  'ai-tools-productivity': { focusAreas: ['AI Tools', 'Productivity'], bestFor: 'Exploring tools and improving everyday workflows', skillLevel: 'All Levels' },
  'ml-research': { focusAreas: ['Machine Learning', 'Research'], bestFor: 'Understanding machine-learning ideas and research', skillLevel: 'Advanced' },
  'ai-business-startups': { focusAreas: ['AI Business', 'Product Strategy'], bestFor: 'Exploring AI adoption and technology businesses', skillLevel: 'All Levels' },
  'prompt-engineering-no-code': { focusAreas: ['Prompting', 'Automation'], bestFor: 'Learning prompting and visual AI workflows', skillLevel: 'All Levels' },
};

export const creators: Creator[] = creatorGroups.flatMap((group) =>
  memberships[group.slug].map((id) => {
    const profile = profileById.get(id);
    if (!profile) throw new Error(`Unknown creator profile: ${id}`);
    return {
      name: profile.name,
      realName: '',
      platform: profile.url.includes('github.com') ? 'GitHub' : 'Website',
      url: profile.url,
      description: profile.description,
      group: group.slug,
      ...groupDetails[group.slug],
    };
  }),
);
