import { describe, expect, it } from 'vitest';
import { filterJobs, jobStatus, readJobFilters, type Job } from '@/lib/jobs/catalog';
import { jobs } from './fixtures/jobs';
import { parseSavedJobs } from '@/lib/hooks/useSavedJobs';

const now = '2026-09-14';
const filters = (query: string) => readJobFilters(new URLSearchParams(query));
describe('jobs discovery', () => {
  it('keeps country selection across overlapping opportunity sections', () => {
    const fulltime = filterJobs(jobs, filters('section=fulltime&country=Canada'), [], now);
    const remote = filterJobs(jobs, filters('section=remote&country=Canada'), [], now);
    expect(fulltime.map((job) => job.id)).toContain('apply-director-ai');
    expect(remote.map((job) => job.id)).toContain('apply-director-ai');
    expect(new Set(remote.map((job) => job.id)).size).toBe(remote.length);
  });
  it('includes worldwide remote work without treating restricted jobs as worldwide', () => {
    const worldwide = filterJobs(jobs, filters('section=remote&country=worldwide'), [], now);
    expect(worldwide.map((job) => job.id)).toEqual(['carma-research-engineer']);
    const india = filterJobs(jobs, filters('section=remote&country=India'), [], now);
    expect(india.map((job) => job.id)).toEqual(['carma-research-engineer']);
  });
  it('combines search, experience, specialization, and arrangement', () => {
    expect(filterJobs(jobs, filters('section=remote&q=python&experience=Leadership&specialization=AI+Engineering&arrangement=Remote'), [], now).map((job) => job.id)).toEqual(['apply-director-ai']);
    expect(filterJobs(jobs, filters('q=doesnotexist'), [], now)).toEqual([]);
  });
  it('retains saved closed jobs but excludes them from discovery', () => {
    const closed: Job = { ...jobs[0], closed: true };
    expect(filterJobs([closed], filters(''), [], now)).toEqual([]);
    expect(filterJobs([closed], filters('saved=true'), [closed.id], now, true)).toEqual([closed]);
    expect(jobStatus(closed, now)).toBe('closed');
  });
  it('expires source reviews separately from application deadlines', () => {
    expect(jobStatus(jobs[0], '2026-10-15')).toBe('review');
    expect(jobStatus({ ...jobs[0], closesAt: '2026-09-13' }, now)).toBe('closed');
    expect(jobStatus({ ...jobs[0], closesAt: now }, now)).toBe('open');
  });
  it('handles invalid filters and stored data without fabricated results', () => {
    expect(filters('section=unknown').section).toBe('internship');
    expect(filterJobs(jobs, filters('country=Unknown'), [], now)).toEqual([]);
    expect(parseSavedJobs('invalid json')).toEqual([]);
    expect(parseSavedJobs('["one",null,"one",8]')).toEqual(['one']);
  });
  it('has unique jobs and valid primary source links', () => {
    expect(new Set(jobs.map((job) => job.id)).size).toBe(jobs.length);
    expect(new Set(jobs.map((job) => job.sourceUrl)).size).toBe(jobs.length);
    for (const job of jobs) {
      expect(['job-boards.greenhouse.io', 'jobs.lever.co']).toContain(new URL(job.sourceUrl).hostname);
      expect(job.worldwide ? job.arrangement === 'Remote' : job.countries.length > 0).toBe(true);
      expect(job.checkedAt <= job.reviewBy).toBe(true);
    }
  });
});
