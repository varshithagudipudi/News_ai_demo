/**
 * AI Content Creators directory data. Local sample data — replace with real,
 * verified creators whenever you're ready. Add, remove or edit entries here;
 * the directory UI (CreatorDirectory/CreatorCard/CreatorFilters) reads
 * entirely from this file, and filter options are derived from it.
 */

export type CreatorGroupSlug =
  | 'ai-news-trends'
  | 'ai-coding'
  | 'ai-tools-productivity'
  | 'ml-research'
  | 'ai-business-startups'
  | 'prompt-engineering-no-code';

export interface CreatorGroupDefinition {
  slug: CreatorGroupSlug;
  name: string;
}

export const creatorGroups: CreatorGroupDefinition[] = [
  { slug: 'ai-news-trends', name: 'AI News & Trends' },
  { slug: 'ai-coding', name: 'AI Coding' },
  { slug: 'ai-tools-productivity', name: 'AI Tools & Productivity' },
  { slug: 'ml-research', name: 'Machine Learning Research' },
  { slug: 'ai-business-startups', name: 'AI Business & Startups' },
  { slug: 'prompt-engineering-no-code', name: 'Prompt Engineering / No-code AI' },
];

export interface Creator {
  /** Brand / channel name — shown as the card heading. */
  name: string;
  /** The person behind the brand. */
  realName: string;
  platform: string;
  url: string;
  focusAreas: string[];
  skillLevel: string;
  bestFor: string;
  description: string;
  group: CreatorGroupSlug;
}

/**
 * No real profile URLs exist yet, so `url` points to a live search for the
 * brand instead of a dead example.com placeholder. Replace with the real
 * account link as soon as one is known.
 */
function creatorSearchUrl(name: string, platform: string): string {
  const query = encodeURIComponent(name);
  if (platform === 'YouTube') {
    return `https://www.youtube.com/results?search_query=${query}`;
  }
  if (platform === 'Substack') {
    return `https://substack.com/search/${query}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${name} ${platform}`)}`;
}

export const creators: Creator[] = [
  // AI News & Trends
  {
    name: 'The AI Report',
    realName: 'Priya Nandakumar',
    platform: 'Newsletter',
    url: creatorSearchUrl('The AI Report', 'Newsletter'),
    focusAreas: ['Industry News', 'Model Releases'],
    skillLevel: 'All Levels',
    bestFor: 'Staying current on daily AI headlines',
    description:
      'A concise daily digest covering new model releases, funding news, and policy shifts across the AI industry.',
    group: 'ai-news-trends',
  },
  {
    name: 'Signal & Noise AI',
    realName: 'Marcus Webb',
    platform: 'YouTube',
    url: creatorSearchUrl('Signal & Noise AI', 'YouTube'),
    focusAreas: ['Industry News', 'Analysis'],
    skillLevel: 'Intermediate',
    bestFor: 'Weekly deep-dive commentary on major AI announcements',
    description:
      'Weekly video breakdowns that separate hype from substance in the latest AI news cycle.',
    group: 'ai-news-trends',
  },
  {
    name: 'Frontier Weekly',
    realName: 'Elena Kowalski',
    platform: 'Substack',
    url: creatorSearchUrl('Frontier Weekly', 'Substack'),
    focusAreas: ['Research Trends', 'Industry News'],
    skillLevel: 'Advanced',
    bestFor: 'Readers who want context behind the headlines',
    description:
      'Long-form analysis connecting new research papers to the products and companies shipping them.',
    group: 'ai-news-trends',
  },

  // AI Coding
  {
    name: 'CodeCraft AI',
    realName: 'Daniel Osei',
    platform: 'YouTube',
    url: creatorSearchUrl('CodeCraft AI', 'YouTube'),
    focusAreas: ['AI-Assisted Coding', 'Agents'],
    skillLevel: 'Intermediate',
    bestFor: 'Developers building with AI coding agents',
    description:
      'Hands-on tutorials on pairing with AI coding assistants, from autocomplete to autonomous agents.',
    group: 'ai-coding',
  },
  {
    name: 'Build With Prompts',
    realName: 'Sofia Marchetti',
    platform: 'YouTube',
    url: creatorSearchUrl('Build With Prompts', 'YouTube'),
    focusAreas: ['AI-Assisted Coding', 'Automation'],
    skillLevel: 'Beginner',
    bestFor: 'New developers learning to code alongside AI tools',
    description:
      'Beginner-friendly walkthroughs showing how to plan, write, and debug code with an AI copilot.',
    group: 'ai-coding',
  },
  {
    name: 'Agent Foundry',
    realName: 'Rahul Deshpande',
    platform: 'Blog',
    url: creatorSearchUrl('Agent Foundry', 'Blog'),
    focusAreas: ['Agents', 'AI-Assisted Coding'],
    skillLevel: 'Advanced',
    bestFor: 'Engineers architecting multi-step AI agent systems',
    description:
      'Deep technical write-ups on designing, testing, and deploying autonomous coding agents in production.',
    group: 'ai-coding',
  },

  // AI Tools & Productivity
  {
    name: 'Toolstack Weekly',
    realName: 'Grace Lindqvist',
    platform: 'Newsletter',
    url: creatorSearchUrl('Toolstack Weekly', 'Newsletter'),
    focusAreas: ['Productivity', 'Tool Roundups'],
    skillLevel: 'All Levels',
    bestFor: 'Discovering new AI apps before they trend',
    description:
      'A weekly roundup of new and updated AI tools, sorted by what they actually help you get done.',
    group: 'ai-tools-productivity',
  },
  {
    name: 'The Workflow Lab',
    realName: 'Tomás Rivera',
    platform: 'YouTube',
    url: creatorSearchUrl('The Workflow Lab', 'YouTube'),
    focusAreas: ['Productivity', 'Automation'],
    skillLevel: 'Intermediate',
    bestFor: 'Professionals wiring AI tools into daily workflows',
    description:
      'Practical demos on chaining AI tools together to automate research, writing, and admin work.',
    group: 'ai-tools-productivity',
  },

  // Machine Learning Research
  {
    name: 'Papers Explained',
    realName: 'Wei Zhang',
    platform: 'YouTube',
    url: creatorSearchUrl('Papers Explained', 'YouTube'),
    focusAreas: ['Research Papers', 'Deep Learning'],
    skillLevel: 'Advanced',
    bestFor: 'Practitioners who want papers summarized clearly',
    description:
      'Visual breakdowns of recent machine learning papers, focused on the core idea and why it matters.',
    group: 'ml-research',
  },
  {
    name: 'Model Internals',
    realName: 'Aisha Bello',
    platform: 'Blog',
    url: creatorSearchUrl('Model Internals', 'Blog'),
    focusAreas: ['Deep Learning', 'Research Papers'],
    skillLevel: 'Advanced',
    bestFor: 'Researchers and engineers studying model architecture',
    description:
      'Technical essays dissecting model architectures, training techniques, and evaluation methods.',
    group: 'ml-research',
  },
  {
    name: 'Foundations of ML',
    realName: 'James Whitfield',
    platform: 'Podcast',
    url: creatorSearchUrl('Foundations of ML', 'Podcast'),
    focusAreas: ['Deep Learning', 'Theory'],
    skillLevel: 'Intermediate',
    bestFor: 'Listeners who want research explained conversationally',
    description:
      'Interviews with researchers that unpack machine learning concepts for a technically curious audience.',
    group: 'ml-research',
  },

  // AI Business & Startups
  {
    name: 'Founder & Model',
    realName: 'Nadia Farouk',
    platform: 'Podcast',
    url: creatorSearchUrl('Founder & Model', 'Podcast'),
    focusAreas: ['Startups', 'Go-to-Market'],
    skillLevel: 'Intermediate',
    bestFor: 'Founders building AI-native products',
    description:
      'Conversations with AI startup founders about product strategy, pricing, and go-to-market lessons.',
    group: 'ai-business-startups',
  },
  {
    name: 'The AI Business Brief',
    realName: 'Connor Blake',
    platform: 'LinkedIn',
    url: creatorSearchUrl('The AI Business Brief', 'LinkedIn'),
    focusAreas: ['Startups', 'Enterprise AI'],
    skillLevel: 'All Levels',
    bestFor: 'Operators tracking AI adoption in business',
    description:
      'A twice-weekly brief on AI funding rounds, enterprise deals, and business model shifts.',
    group: 'ai-business-startups',
  },

  // Prompt Engineering / No-code AI
  {
    name: 'Prompt Lab',
    realName: 'Hana Suzuki',
    platform: 'Instagram',
    url: creatorSearchUrl('Prompt Lab', 'Instagram'),
    focusAreas: ['Prompt Engineering'],
    skillLevel: 'Beginner',
    bestFor: 'Anyone learning to write better prompts',
    description:
      'Short, practical lessons on prompt structure, examples, and common mistakes to avoid.',
    group: 'prompt-engineering-no-code',
  },
  {
    name: 'No-Code AI Builders',
    realName: 'Lucas Ferreira',
    platform: 'YouTube',
    url: creatorSearchUrl('No-Code AI Builders', 'YouTube'),
    focusAreas: ['No-Code AI', 'Automation'],
    skillLevel: 'Beginner',
    bestFor: 'Non-developers building AI-powered workflows',
    description:
      'Step-by-step builds using no-code platforms to create AI-powered automations and mini-apps.',
    group: 'prompt-engineering-no-code',
  },
  {
    name: 'Advanced Prompting',
    realName: 'Ingrid Solberg',
    platform: 'Substack',
    url: creatorSearchUrl('Advanced Prompting', 'Substack'),
    focusAreas: ['Prompt Engineering', 'Agents'],
    skillLevel: 'Advanced',
    bestFor: 'Practitioners refining prompts for production systems',
    description:
      'In-depth techniques for prompt chaining, evaluation, and reliability in production AI systems.',
    group: 'prompt-engineering-no-code',
  },
];

const skillLevelBadgeClasses: Record<string, string> = {
  Beginner:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  Intermediate:
    'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
  Advanced:
    'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  'All Levels': 'bg-surface-muted text-fg-muted',
};

export function getSkillLevelBadgeClass(level: string): string {
  return skillLevelBadgeClasses[level] ?? 'bg-surface-muted text-fg-muted';
}
