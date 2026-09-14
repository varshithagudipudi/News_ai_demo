import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeGreenhouse, normalizeLever, locationCountries, plainText } from '@/lib/jobs/normalize';
import { fetchJobSource } from '@/lib/jobs/live';
import { jobSources } from '@/lib/jobs/sources';
import { parseSavedJobs } from '@/lib/hooks/useSavedJobs';
const now = '2026-09-14T12:00:00.000Z';
const lever = { id: 'one', text: 'AI Engineer', hostedUrl: 'https://jobs.lever.co/applydigital/one', categories: { location: 'Toronto, Canada', commitment: 'Full-Time Permanent' }, workplaceType: 'remote', country: 'CA', descriptionPlain: 'Build Python applications.', lists: [] };
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('live job normalization', () => {
  it('uses structured employment, country, and workplace fields', () => {
    const job = normalizeLever(lever, jobSources[2], now)!;
    expect(job.employment).toEqual(['fulltime']);
    expect(job.countries).toEqual(['Canada']);
    expect(job.arrangement).toBe('Remote');
    expect(job.worldwide).toBe(false);
    expect(job.postedAt).toBeUndefined();
    expect(job.checkedAt).toBe(now);
  });
  it('does not assume unknown locations are worldwide', () => {
    const job = normalizeLever({ ...lever, country: null, categories: { location: 'Remote', commitment: 'Freelance' } }, jobSources[2], now)!;
    expect(job.worldwide).toBe(false);
    expect(job.countries).toEqual([]);
    expect(job.employment).toEqual(['freelancing']);
  });
  it('retains explicit global remote work and overlapping commitment types', () => {
    const job = normalizeLever({ ...lever, country: null, categories: { location: 'Anywhere (Open Globally)', commitment: 'Full-Time, Contract' } }, jobSources[3], now)!;
    expect(job.worldwide).toBe(true);
    expect(job.employment).toEqual(['fulltime', 'freelancing']);
  });
  it('does not invent full-time or remote classification for Greenhouse postings', () => {
    const raw = { id: 1, title: 'AI Research Intern', absolute_url: 'https://job-boards.greenhouse.io/karya/jobs/1', content: '&lt;p&gt;Research AI.&lt;/p&gt;', location: { name: 'Bengaluru' }, updated_at: now };
    const job = normalizeGreenhouse(raw, jobSources[0], now)!;
    expect(job.countries).toEqual(['India']);
    expect(job.employment).toEqual(['internship']);
    expect(job.arrangement).toBe('Not specified');
    expect(job.postedAt).toBeUndefined();
    expect(normalizeGreenhouse({ ...raw, title: 'AI Engineer' }, jobSources[0], now)).toBeNull();
  });
  it('filters generic vacancies and talent pools without matching company boilerplate', () => {
    expect(normalizeLever({ ...lever, text: 'Accountant', descriptionPlain: 'We are an AI company' }, jobSources[2], now)).toBeNull();
    expect(normalizeLever({ ...lever, text: 'AI Engineer - Talent Pipeline' }, jobSources[2], now)).toBeNull();
  });
  it('keeps feed content as plain text and rejects unsafe destination URLs', () => {
    expect(plainText('&amp;lt;p&amp;gt;Hello &amp;amp; goodbye&amp;lt;/p&amp;gt;<script>alert(1)</script>')).toBe('Hello & goodbye');
    expect(() => normalizeLever({ ...lever, hostedUrl: 'javascript:alert(1)' }, jobSources[2], now)).toThrow();
  });
  it('formats only explicit structured pay and recognizes multiple countries', () => {
    expect(normalizeLever({ ...lever, salaryRange: { currency: 'USD', min: 15, max: 15, interval: 'hour' } }, jobSources[2], now)?.compensation).toBe('USD 15 / hour');
    expect(locationCountries('Bengaluru, India; Bristol, UK')).toEqual(['India', 'United Kingdom']);
  });
  it('preserves the previously saved manual jobs through stable API IDs', () => {
    expect(parseSavedJobs('["karya-ai-evaluations-intern", "karya_5416262008"]')).toEqual(['karya_5416262008']);
  });
});
describe('live job retrieval', () => {
  it('coalesces requests, expires its cache, removes closed listings, and does not fall back after failures', async () => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(now));
    let mode = 'open';
    const fetcher = vi.fn(async (url: string) => mode === 'error' ? new Response('', { status: 503 }) : url.includes('greenhouse') ? Response.json({ jobs: [] }) : Response.json(mode === 'open' ? [lever] : []));
    vi.stubGlobal('fetch', fetcher);
    const { getLiveJobs, getLiveJob } = await import('@/lib/jobs/live');
    const [first, concurrent] = await Promise.all([getLiveJobs(), getLiveJobs()]);
    expect(first.jobs.length).toBeGreaterThan(0);
    expect(concurrent.jobs).toEqual(first.jobs);
    expect(fetcher).toHaveBeenCalledTimes(5);
    await getLiveJobs();
    expect(fetcher).toHaveBeenCalledTimes(5);
    mode = 'closed';
    vi.setSystemTime(new Date(Date.parse(now) + 16 * 60 * 1000));
    expect((await getLiveJobs()).jobs).toEqual([]);
    expect(await getLiveJob('apply_one')).toBeNull();
    mode = 'error';
    vi.setSystemTime(new Date(Date.parse(now) + 32 * 60 * 1000));
    const failed = await getLiveJobs();
    expect(failed.jobs).toEqual([]);
    expect(failed.sources.every((source) => source.status === 'error')).toBe(true);
    await expect(getLiveJob('apply_one')).rejects.toThrow('temporarily unavailable');
  });
  it('fetches every Lever page and deduplicates IDs', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(Array.from({ length: 500 }, (_, id) => ({ ...lever, id: String(id) })))).mockResolvedValueOnce(Response.json([{ ...lever, id: '500' }, { ...lever, id: '1' }]));
    const result = await fetchJobSource(jobSources[2], fetcher);
    expect(result.jobs).toHaveLength(501);
    expect(fetcher.mock.calls[1][0]).toContain('skip=500');
    expect(fetcher.mock.calls[0][1].cache).toBe('no-store');
  });
  it('treats empty feeds as success and rejects provider failures or malformed payloads', async () => {
    expect((await fetchJobSource(jobSources[0], vi.fn().mockResolvedValue(Response.json({ jobs: [] })))).source.status).toBe('ok');
    await expect(fetchJobSource(jobSources[0], vi.fn().mockResolvedValue(new Response('', { status: 503 })))).rejects.toThrow();
    await expect(fetchJobSource(jobSources[2], vi.fn().mockResolvedValue(Response.json({ error: true })))).rejects.toThrow();
  });
});
