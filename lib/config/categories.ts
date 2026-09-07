/**
 * Category definitions. Add, remove or reorder entries here — navigation,
 * validation and the collection pipeline all read from this list.
 *
 * `query` uses the provider's search syntax and is only used for collection.
 * The `all` pseudo-category is never stored on an article; it means "no filter".
 */

export type CategorySlug =
  | 'all'
  | 'artificial-intelligence'
  | 'generative-ai'
  | 'ai-tools'
  | 'ai-events'
  | 'machine-learning'
  | 'robotics'
  | 'startups'
  | 'funding'
  | 'ai-content-creators'
  | 'business';

export interface CategoryDefinition {
  slug: CategorySlug;
  name: string;
  /** Provider search query. Absent for the `all` pseudo-category. */
  query?: string;
  /** Phrases that, in a title, strongly indicate this category. */
  strongTerms: string[];
  /** Tailwind classes for the category badge. */
  badgeClass: string;
  /**
   * Overrides `COLLECT_MAX_AGE_HOURS` for this category's collection run.
   * Sparser categories need a longer lookback than the daily-volume default.
   */
  maxAgeHours?: number;
}

export const ALL_CATEGORY_SLUG = 'all' as const;

export const categories: CategoryDefinition[] = [
  {
    slug: 'all',
    name: 'All News',
    strongTerms: [],
    badgeClass: 'text-fg-muted',
  },
  {
    slug: 'artificial-intelligence',
    name: 'Artificial Intelligence',
    query: '"artificial intelligence" OR "AI model" OR "AI research"',
    strongTerms: [
      'artificial intelligence',
      'ai model',
      'ai research',
      'ai system',
      'ai lab',
    ],
    badgeClass: 'text-violet-700 dark:text-violet-400',
  },
  {
    slug: 'generative-ai',
    name: 'Generative AI',
    query: '"generative AI" OR ChatGPT OR Claude OR Gemini OR "large language model"',
    strongTerms: [
      'generative ai',
      'chatgpt',
      'claude',
      'gemini',
      'large language model',
      'llm',
      'copilot',
      'midjourney',
      'stable diffusion',
    ],
    badgeClass: 'text-fuchsia-700 dark:text-fuchsia-400',
  },
  {
    slug: 'ai-tools',
    name: 'AI Tools',
    query: '"AI tool" OR "AI software" OR "AI assistant" OR "AI agent"',
    strongTerms: [
      'ai tool',
      'ai tools',
      'ai software',
      'ai assistant',
      'ai agent',
      'ai app',
      'ai platform',
    ],
    badgeClass: 'text-sky-700 dark:text-sky-400',
  },
  {
    slug: 'ai-events',
    name: 'AI Events',
    query:
      '"AI event" OR "AI conference" OR "artificial intelligence conference" OR "AI summit" OR "AI webinar" OR "AI workshop" OR "AI hackathon" OR "AI expo"',
    strongTerms: [
      'ai event',
      'ai events',
      'ai conference',
      'artificial intelligence conference',
      'ai summit',
      'ai webinar',
      'ai workshop',
      'ai hackathon',
    ],
    badgeClass: 'text-cyan-700 dark:text-cyan-400',
    // Event/conference coverage is sporadic; the display range on the
    // homepage is 30 days, so collection needs to reach back that far too.
    maxAgeHours: 24 * 30,
  },
  {
    slug: 'machine-learning',
    name: 'Machine Learning',
    query: '"machine learning" OR "deep learning" OR "neural network"',
    strongTerms: [
      'machine learning',
      'deep learning',
      'neural network',
      'training data',
      'inference',
    ],
    badgeClass: 'text-emerald-700 dark:text-emerald-400',
  },
  {
    slug: 'robotics',
    name: 'Robotics',
    query: 'robotics OR "humanoid robot" OR "autonomous robot"',
    strongTerms: [
      'robotics',
      'humanoid robot',
      'autonomous robot',
      'robot arm',
      'drone',
    ],
    badgeClass: 'text-amber-700 dark:text-amber-400',
  },
  {
    slug: 'startups',
    name: 'Startups',
    query: '"technology startup" OR "AI startup" OR "tech startup"',
    strongTerms: [
      'startup',
      'startups',
      'founder',
      'founders',
      'y combinator',
      'accelerator',
    ],
    badgeClass: 'text-rose-700 dark:text-rose-400',
  },
  {
    slug: 'funding',
    name: 'Funding',
    query: '"startup funding" OR "seed funding" OR "Series A" OR "venture capital"',
    strongTerms: [
      'funding',
      'seed round',
      'seed funding',
      'series a',
      'series b',
      'series c',
      'venture capital',
      'raises',
      'valuation',
      'ipo',
    ],
    badgeClass: 'text-teal-700 dark:text-teal-400',
  },
  {
    slug: 'ai-content-creators',
    name: 'AI Content Creators',
    query:
      '"AI content creator" OR "AI YouTuber" OR "AI newsletter" OR "AI podcast" OR "AI educator"',
    strongTerms: [
      'ai content creator',
      'ai content creators',
      'ai youtuber',
      'ai newsletter',
      'ai podcast',
      'ai educator',
      'ai influencer',
    ],
    badgeClass: 'text-lime-700 dark:text-lime-400',
  },
  {
    slug: 'business',
    name: 'Business',
    query: '"AI company" OR "AI acquisition" OR "AI partnership" OR "AI enterprise"',
    strongTerms: [
      'acquisition',
      'acquires',
      'partnership',
      'enterprise',
      'revenue',
      'merger',
      'ai company',
    ],
    badgeClass: 'text-indigo-700 dark:text-indigo-400',
  },
];

/** Categories that are actually collected and stored (excludes `all`). */
export const collectableCategories = categories.filter(
  (category): category is CategoryDefinition & { query: string } =>
    category.slug !== ALL_CATEGORY_SLUG && Boolean(category.query),
);

export const categorySlugs = categories.map((category) => category.slug);

export const storableCategorySlugs = collectableCategories.map(
  (category) => category.slug,
);

const categoryBySlug = new Map(
  categories.map((category) => [category.slug as string, category]),
);

export function getCategory(slug: string): CategoryDefinition | undefined {
  return categoryBySlug.get(slug);
}

export function getCategoryName(slug: string): string {
  return categoryBySlug.get(slug)?.name ?? slug;
}

export function getCategoryBadgeClass(slug: string): string {
  return categoryBySlug.get(slug)?.badgeClass ?? 'text-fg-muted';
}

export function isStorableCategory(slug: string): boolean {
  return storableCategorySlugs.includes(slug as CategorySlug);
}
