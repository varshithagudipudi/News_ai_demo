export interface JobSource { key: string; provider: 'greenhouse' | 'lever'; board: string; company: string }
export const jobSources: JobSource[] = [
  { key: 'karya', provider: 'greenhouse', board: 'karya', company: 'Karya' },
  { key: 'graphcore', provider: 'greenhouse', board: 'graphcore-early-careers', company: 'Graphcore' },
  { key: 'apply', provider: 'lever', board: 'applydigital', company: 'APPLY' },
  { key: 'carma', provider: 'lever', board: 'futureof-life', company: 'Future of Life Organizations' },
  { key: 'welo', provider: 'lever', board: 'weloglobal', company: 'Welo Global / Welo Data' },
];
export const JOB_REFRESH_MS = 15 * 60 * 1000;
export const legacyJobIds: Record<string, string> = {
  'karya-ai-evaluations-intern': 'karya_5416262008',
  'graphcore-silicon-intern-2027': 'graphcore_8795702002',
  'apply-director-ai': 'apply_83d148d7-51c1-470b-9d53-a535ee08334a',
  'carma-research-engineer': 'carma_759df9eb-5611-4a42-b92d-aa199c6f2a7d',
  'welo-spanish-us-ai-analyst': 'welo_87d6e588-f2f2-4daf-9ba5-9396ad026541',
};
export interface JobSourceStatus { key: string; company: string; status: 'ok' | 'error'; count: number; fetchedAt: string | null }
export interface LiveJobsResponse {
  jobs: import('./catalog').Job[]; sources: JobSourceStatus[]; fetchedAt: string;
}
