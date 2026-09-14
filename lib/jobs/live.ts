import 'server-only';
import { z } from 'zod';
import { jobSources, JOB_REFRESH_MS, legacyJobIds, type JobSource, type JobSourceStatus, type LiveJobsResponse } from './sources';
import { normalizeGreenhouse, normalizeLever } from './normalize';
import type { Job } from './catalog';

type SourceResult = { jobs: Job[]; source: JobSourceStatus };
// Share request locks across the API and React server bundles in this process.
const processState = globalThis as typeof globalThis & { __aiPulseLiveJobs?: {
  cache: Map<string, { expires: number; result: SourceResult }>;
  pending: Map<string, Promise<SourceResult>>;
} };
const { cache, pending } = processState.__aiPulseLiveJobs ??= { cache: new Map(), pending: new Map() };

export async function fetchJobSource(source: JobSource, fetcher: typeof fetch = fetch): Promise<SourceResult> {
  const now = new Date().toISOString();
  const signal = AbortSignal.timeout(45000);
  const records: unknown[] = [];
  if (source.provider === 'greenhouse') {
    const response = await fetcher(`https://boards-api.greenhouse.io/v1/boards/${source.board}/jobs?content=true`, { cache: 'no-store', signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Job source returned ${response.status}`);
    records.push(...z.object({ jobs: z.array(z.unknown()) }).parse(await response.json()).jobs);
  } else {
    const pageSize = 500;
    for (let page = 0; page < 10; page++) {
      const response = await fetcher(`https://api.lever.co/v0/postings/${source.board}?mode=json&limit=${pageSize}&skip=${page * pageSize}`, { cache: 'no-store', signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`Job source returned ${response.status}`);
      const rows = z.array(z.unknown()).parse(await response.json());
      records.push(...rows);
      if (rows.length < pageSize) break;
      if (page === 9) throw new Error('Job source pagination incomplete');
    }
  }
  const jobs = records.map((record) => source.provider === 'lever' ? normalizeLever(record, source, now) : normalizeGreenhouse(record, source, now)).filter((job): job is Job => job !== null);
  return { jobs: [...new Map(jobs.map((job) => [job.id, job])).values()], source: { key: source.key, company: source.company, status: 'ok', count: jobs.length, fetchedAt: now } };
}
async function getSource(source: JobSource): Promise<SourceResult> {
  const existing = cache.get(source.key);
  if (existing && existing.expires > Date.now()) return existing.result;
  if (pending.has(source.key)) return pending.get(source.key)!;
  const request = fetchJobSource(source).then((result) => {
    cache.set(source.key, { result, expires: Date.now() + JOB_REFRESH_MS });
    return result;
  }).catch((error: unknown) => {
    console.warn('[jobs] Employer feed unavailable:', source.key, error instanceof Error ? error.name : 'Unknown error');
    const result: SourceResult = { jobs: [], source: { key: source.key, company: source.company, status: 'error', count: 0, fetchedAt: null } };
    // Do not replace a failed feed with old listings; briefly back off retries.
    cache.set(source.key, { result, expires: Date.now() + 30000 });
    return result;
  }).finally(() => pending.delete(source.key));
  pending.set(source.key, request);
  return request;
}
export async function getLiveJobs(): Promise<LiveJobsResponse> {
  const results = await Promise.all(jobSources.map(getSource));
  return { jobs: [...new Map(results.flatMap((result) => result.jobs).map((job) => [job.sourceUrl, job])).values()], sources: results.map((result) => result.source), fetchedAt: new Date().toISOString() };
}
export async function getLiveJob(id: string): Promise<Job | null> {
  const canonical = legacyJobIds[id] ?? id;
  const source = jobSources.find((item) => canonical.startsWith(item.key + '_'));
  if (!source) return null;
  const result = await getSource(source);
  if (result.source.status === 'error') throw new Error('The employer feed is temporarily unavailable. Please try again.');
  return result.jobs.find((job) => job.id === canonical) ?? null;
}
