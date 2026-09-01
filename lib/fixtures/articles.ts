/**
 * Development fixtures. Used by `npm run db:seed` to populate the local store
 * so the UI can be worked on without provider credentials.
 *
 * These are illustrative placeholders, not real headlines. They are never
 * inserted by a scheduled collection run — only by the explicit seed command.
 */

export interface FixtureArticle {
  title: string;
  description: string;
  category: string;
  sourceName: string;
  sourceUrl: string;
  articleUrl: string;
  imageUrl: string | null;
  /** Hours before "now" that this fixture was published. */
  publishedHoursAgo: number;
  relevanceScore: number;
}

export const fixtureArticles: FixtureArticle[] = [
  {
    title:
      'Sample: research lab publishes new evaluation suite for language models',
    description:
      'Placeholder development record describing an evaluation suite covering reasoning, retrieval and long-context behaviour across open and closed models.',
    category: 'generative-ai',
    sourceName: 'Example Tech Review',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/evaluation-suite',
    imageUrl: 'https://picsum.photos/seed/aipulse1/800/450',
    publishedHoursAgo: 2,
    relevanceScore: 82,
  },
  {
    title: 'Sample: enterprise AI assistant adds document workflow automation',
    description:
      'Placeholder development record about an AI assistant gaining workflow automation for document review inside existing enterprise suites.',
    category: 'ai-tools',
    sourceName: 'Example Product Wire',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/assistant-workflows',
    imageUrl: 'https://picsum.photos/seed/aipulse2/800/450',
    publishedHoursAgo: 5,
    relevanceScore: 74,
  },
  {
    title: 'Sample: seed-stage startup raises Series A for inference tooling',
    description:
      'Placeholder development record covering a Series A round for a company building inference optimisation tooling for smaller deployments.',
    category: 'funding',
    sourceName: 'Example Venture Daily',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/series-a-inference',
    imageUrl: null,
    publishedHoursAgo: 9,
    relevanceScore: 78,
  },
  {
    title: 'Sample: humanoid robot pilot expands to a second warehouse site',
    description:
      'Placeholder development record about a humanoid robotics pilot programme extending from one warehouse to a second logistics facility.',
    category: 'robotics',
    sourceName: 'Example Robotics Report',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/humanoid-warehouse',
    imageUrl: 'https://picsum.photos/seed/aipulse4/800/450',
    publishedHoursAgo: 14,
    relevanceScore: 69,
  },
  {
    title: 'Sample: new deep learning method reduces training cost for vision models',
    description:
      'Placeholder development record describing a training technique that reportedly lowers compute requirements for computer vision workloads.',
    category: 'machine-learning',
    sourceName: 'Example Research Digest',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/vision-training-cost',
    imageUrl: 'https://picsum.photos/seed/aipulse5/800/450',
    publishedHoursAgo: 20,
    relevanceScore: 71,
  },
  {
    title: 'Sample: accelerator announces cohort focused on applied AI startups',
    description:
      'Placeholder development record about a startup accelerator opening applications for a cohort dedicated to applied artificial intelligence teams.',
    category: 'startups',
    sourceName: 'Example Founders Weekly',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/accelerator-cohort',
    imageUrl: null,
    publishedHoursAgo: 26,
    relevanceScore: 63,
  },
  {
    title: 'Sample: two AI companies announce enterprise distribution partnership',
    description:
      'Placeholder development record covering a distribution partnership between an AI company and an established enterprise software vendor.',
    category: 'business',
    sourceName: 'Example Business Brief',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/distribution-partnership',
    imageUrl: 'https://picsum.photos/seed/aipulse7/800/450',
    publishedHoursAgo: 31,
    relevanceScore: 66,
  },
  {
    title: 'Sample: national body publishes artificial intelligence safety guidance',
    description:
      'Placeholder development record about published guidance covering evaluation, disclosure and incident reporting for AI systems.',
    category: 'artificial-intelligence',
    sourceName: 'Example Policy Monitor',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/safety-guidance',
    imageUrl: 'https://picsum.photos/seed/aipulse8/800/450',
    publishedHoursAgo: 38,
    relevanceScore: 80,
  },
  {
    title: 'Sample: open weights model release adds longer context window',
    description:
      'Placeholder development record describing an open weights model release with an extended context window and revised licence terms.',
    category: 'generative-ai',
    sourceName: 'Example Model Watch',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/open-weights-context',
    imageUrl: 'https://picsum.photos/seed/aipulse9/800/450',
    publishedHoursAgo: 44,
    relevanceScore: 76,
  },
  {
    title: 'Sample: developer tool adds agent evaluation and tracing dashboard',
    description:
      'Placeholder development record about a developer tool shipping tracing and evaluation views for multi-step agent runs.',
    category: 'ai-tools',
    sourceName: 'Example Dev Tools News',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/agent-tracing',
    imageUrl: null,
    publishedHoursAgo: 51,
    relevanceScore: 64,
  },
  {
    title: 'Sample: venture fund closes vehicle targeting early stage AI infrastructure',
    description:
      'Placeholder development record covering a new fund aimed at early stage companies building AI infrastructure and tooling.',
    category: 'funding',
    sourceName: 'Example Capital Notes',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/infrastructure-fund',
    imageUrl: 'https://picsum.photos/seed/aipulse11/800/450',
    publishedHoursAgo: 58,
    relevanceScore: 70,
  },
  {
    title: 'Sample: manufacturer trials autonomous robot inspection on production line',
    description:
      'Placeholder development record about autonomous inspection robots being trialled alongside human operators on a production line.',
    category: 'robotics',
    sourceName: 'Example Industry Wire',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/robot-inspection',
    imageUrl: 'https://picsum.photos/seed/aipulse12/800/450',
    publishedHoursAgo: 66,
    relevanceScore: 61,
  },
  {
    title: 'Sample: startup exits stealth with machine learning platform for logistics',
    description:
      'Placeholder development record about a company leaving stealth mode with a machine learning platform aimed at logistics planning.',
    category: 'startups',
    sourceName: 'Example Startup Desk',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/logistics-platform',
    imageUrl: null,
    publishedHoursAgo: 73,
    relevanceScore: 62,
  },
  {
    title: 'Sample: quarterly results show rising enterprise AI software revenue',
    description:
      'Placeholder development record summarising quarterly results in which enterprise AI software revenue grew against the prior period.',
    category: 'business',
    sourceName: 'Example Market Report',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/quarterly-results',
    imageUrl: 'https://picsum.photos/seed/aipulse14/800/450',
    publishedHoursAgo: 80,
    relevanceScore: 58,
  },
  {
    title: 'Sample: neural network compression technique published with open benchmarks',
    description:
      'Placeholder development record about a compression technique released with reproducible benchmarks for edge deployment.',
    category: 'machine-learning',
    sourceName: 'Example Research Digest',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/compression-benchmarks',
    imageUrl: 'https://picsum.photos/seed/aipulse15/800/450',
    publishedHoursAgo: 90,
    relevanceScore: 67,
  },
  {
    title: 'Sample: consortium proposes shared evaluation standard for AI systems',
    description:
      'Placeholder development record describing a proposed shared standard for reporting evaluation results across AI systems.',
    category: 'artificial-intelligence',
    sourceName: 'Example Standards Journal',
    sourceUrl: 'https://example.com',
    articleUrl: 'https://example.com/ai-pulse-fixtures/evaluation-standard',
    imageUrl: null,
    publishedHoursAgo: 101,
    relevanceScore: 65,
  },
];
