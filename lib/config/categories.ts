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
  | 'machine-learning'
  | 'robotics'
  | 'startups'
  | 'funding'
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
}

export const ALL_CATEGORY_SLUG = 'all' as const;

export const categories: CategoryDefinition[] = [
  {
    slug: 'all',
    name: 'All News',
    strongTerms: [],
    badgeClass: 'bg-surface-muted text-fg-muted',
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
    badgeClass:
      'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300',
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
    badgeClass:
      'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-500/15 dark:text-fuchsia-300',
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
    badgeClass:
      'bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300',
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
    badgeClass:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
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
    badgeClass:
      'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
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
    badgeClass:
      'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
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
    badgeClass:
      'bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300',
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
    badgeClass:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300',
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
  return (
    categoryBySlug.get(slug)?.badgeClass ?? 'bg-surface-muted text-fg-muted'
  );
}

export function isStorableCategory(slug: string): boolean {
  return storableCategorySlugs.includes(slug as CategorySlug);
}
