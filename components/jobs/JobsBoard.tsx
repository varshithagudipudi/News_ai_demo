'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { JobSaveButton } from '@/components/jobs/JobSaveButton';
import { useSavedJobs } from '@/lib/hooks/useSavedJobs';
import { filterJobs, jobLocation, jobSections, jobStatus, readJobFilters } from '@/lib/jobs/catalog';
import { JOB_REFRESH_MS, type LiveJobsResponse } from '@/lib/jobs/sources';

const unique = (items: string[]) => [...new Set(items)].sort();
const date = (value: string) => new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));

export function JobsBoard({ initialData }: { initialData: LiveJobsResponse }) {
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const refreshRequest = useRef<AbortController | null>(null);
  const lastAttempt = useRef(Date.now());
  const jobs = data.jobs;
  const now = data.fetchedAt;
  const failedSources = data.sources.filter((source) => source.status === 'error');
  const successfulSources = data.sources.filter((source) => source.status === 'ok');
  const lastFetched = successfulSources.map((source) => source.fetchedAt!).sort()[0];
  const refresh = useCallback(async () => {
    if (refreshRequest.current) return;
    const controller = new AbortController();
    refreshRequest.current = controller;
    lastAttempt.current = Date.now();
    setRefreshing(true);
    try {
      const response = await fetch('/api/jobs', { cache: 'no-store', signal: controller.signal });
      const payload = await response.json() as LiveJobsResponse;
      if (!Array.isArray(payload.jobs) || !Array.isArray(payload.sources)) throw new Error('Invalid jobs response');
      setData(payload);
    } catch {
      if (!controller.signal.aborted) setData((current) => ({ ...current, jobs: [], sources: current.sources.map((source) => ({ ...source, status: 'error', count: 0, fetchedAt: null })) }));
    } finally {
      if (!controller.signal.aborted) setRefreshing(false);
      refreshRequest.current = null;
    }
  }, []);
  useEffect(() => {
    const onFocus = () => { if (Date.now() - lastAttempt.current >= JOB_REFRESH_MS) void refresh(); };
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, JOB_REFRESH_MS);
    window.addEventListener('focus', onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', onFocus); refreshRequest.current?.abort(); refreshRequest.current = null; };
  }, [refresh]);
  const params = useSearchParams();
  const filters = readJobFilters(new URLSearchParams(params.toString()));
  const { savedIds, storageError } = useSavedJobs();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState({ key: '', count: 10 });
  const key = params.toString();
  const visible = filterJobs(jobs, filters, savedIds, now, filters.saved);
  const count = Math.min(expanded.key === key ? expanded.count : 10, visible.length);
  const countries = unique(jobs.filter((job) => jobStatus(job, now) === 'open').flatMap((job) => job.countries));
  const countryOptions = filters.country !== 'all' && filters.country !== 'worldwide' && !countries.includes(filters.country) ? [...countries, filters.country] : countries;
  const savedCount = savedIds.length;
  const missingSaved = savedIds.filter((id) => !jobs.some((job) => job.id === id)).length;
  const hasFilters = Boolean(filters.query || filters.country !== 'all' || filters.experience !== 'all' || filters.specialization !== 'all' || filters.arrangement !== 'all');

  useEffect(() => {
    if (params.get('focus') === 'search') document.getElementById('site-search')?.focus();
  }, [params]);

  function update(values: Record<string, string | null>, replace = false) {
    const next = new URLSearchParams(params.toString());
    next.delete('focus');
    for (const [name, value] of Object.entries(values)) {
      if (!value || value === 'all' || value === 'false') next.delete(name); else next.set(name, value);
    }
    const href = '/jobs' + (next.size ? '?' + next.toString() : '');
    if (replace) window.history.replaceState(null, '', href); else window.history.pushState(null, '', href);
  }
  function clear() { update({ q: null, country: null, experience: null, specialization: null, arrangement: null }); }

  return <section id="jobs-board" aria-labelledby="jobs-heading" className="px-4 pb-16 pt-6 sm:px-6">
    <div className="jobs-hero">
      <div className="relative min-w-0">
        <p className="section-eyebrow mb-3">AI Pulse · Careers & opportunities</p>
        <h1 id="jobs-heading" className="text-[32px] font-bold leading-[1.12] tracking-[-0.04em] text-fg sm:text-[44px]">Your next chapter.<br className="sm:hidden" /> <span className="text-accent">Powered by AI.</span></h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fg-muted sm:text-base">Find a place to learn, build, and make an impact. Explore AI opportunities by country and the way you want to work.</p>
      </div>
      <form role="search" aria-label="Search AI jobs" className="relative mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]" onSubmit={(event) => event.preventDefault()}>
        <div className="jobs-search-input">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-5 w-5 shrink-0 text-accent"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/></svg>
          <label htmlFor="site-search" className="sr-only">Search role, company, or skill</label>
          <input id="site-search" type="search" placeholder="Search role, company, or skill…" value={filters.query} onChange={(event) => update({ q: event.target.value }, true)} autoComplete="off" className="min-w-0 flex-1 bg-transparent py-3 text-base text-fg placeholder:text-fg-muted" />
          {filters.query && <button type="button" aria-label="Clear job search" onClick={() => update({ q: null }, true)} className="h-9 w-9 shrink-0 rounded-full text-fg-muted hover:bg-surface-muted">✕</button>}
        </div>
        <div className="rounded-xl border border-border bg-surface px-4 py-2">
          <label htmlFor="jobs-country" className="block text-[10px] font-bold uppercase tracking-wider text-fg-muted">Country / location</label>
          <select id="jobs-country" value={filters.country} onChange={(event) => update({ country: event.target.value })} className="w-full min-w-0 bg-surface py-1 text-sm font-medium text-fg">
            <option value="all">All countries</option><option value="worldwide">Worldwide remote</option>
            {countryOptions.map((country) => <option key={country}>{country}</option>)}
          </select>
        </div>
      </form>
      <p className="relative mt-3 text-xs leading-relaxed text-fg-muted">Country results include worldwide remote roles. Check each posting’s location and work-authorization terms.</p>
    </div>

    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-fg-muted">
      <p role="status">{refreshing ? 'Checking employer feeds…' : lastFetched ? `Employer feeds · fetched ${new Date(lastFetched).toUTCString()}` : 'Employer feeds unavailable'} <span className="text-fg-muted">· Refreshes every 15 minutes</span></p>
      <button type="button" disabled={refreshing} onClick={() => void refresh()} className="rounded-full border border-border bg-surface px-4 py-2 font-semibold text-accent disabled:opacity-50">{refreshing ? 'Refreshing…' : 'Refresh jobs'}</button>
    </div>
    {failedSources.length > 0 && <p role="status" className="mt-4 rounded-xl border border-border bg-surface p-4 text-sm text-fg-muted">{successfulSources.length ? 'Some employer feeds could not be reached. Results include available feeds only.' : 'We couldn’t fetch current openings. Please retry shortly.'} <span className="text-xs">Unavailable: {failedSources.map((source) => source.company).join(', ')}.</span></p>}
    <div role="group" aria-label="Opportunity types" className="my-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {jobSections.map((section) => {
        const total = filterJobs(jobs, { ...filters, section: section.id, saved: false }, [], now).length;
        return <button key={section.id} type="button" aria-pressed={!filters.saved && filters.section === section.id} onClick={() => update({ section: section.id, saved: null })} className="jobs-section-tab">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold"><span>{section.label}</span><span className="rounded-full bg-current/10 px-2 py-0.5 text-xs">{total}</span></span>
          <span className="mt-1.5 hidden text-left text-xs opacity-80 sm:block">{section.description}</span>
        </button>;
      })}
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:gap-8">
      <aside aria-label="Job filters" className="jobs-filter-panel">
        <h2 className="hidden font-display text-base font-semibold text-fg lg:block">Make it your next move</h2>
        <button type="button" aria-expanded={filtersOpen} aria-controls="jobs-filter-controls" onClick={() => setFiltersOpen(!filtersOpen)} className="flex w-full items-center justify-between py-2 text-sm font-semibold text-fg lg:hidden">Refine results <span aria-hidden="true">{filtersOpen ? '−' : '+'}</span></button>
        <div id="jobs-filter-controls" className={`${filtersOpen ? 'block' : 'hidden'} space-y-5 pt-5 lg:block`}>
          {[
            { name: 'experience', label: 'Experience', value: filters.experience, options: unique(jobs.map((job) => job.experience)) },
            { name: 'specialization', label: 'Specialization', value: filters.specialization, options: unique(jobs.map((job) => job.specialization)) },
            { name: 'arrangement', label: 'Work arrangement', value: filters.arrangement, options: unique(jobs.map((job) => job.arrangement)) },
          ].map((filter) => <div key={filter.name}>
            <label htmlFor={`jobs-${filter.name}`} className="mb-2 block text-xs font-semibold text-fg-muted">{filter.label}</label>
            <select id={`jobs-${filter.name}`} value={filter.value} onChange={(event) => update({ [filter.name]: event.target.value })} className="h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-2 text-sm text-fg">
              <option value="all">All {filter.label.toLowerCase()}</option>
              {!filter.options.includes(filter.value) && filter.value !== 'all' && <option>{filter.value}</option>}
              {filter.options.map((option) => <option key={option}>{option}</option>)}
            </select>
          </div>)}
          <div className="rounded-xl bg-accent-soft p-4 text-xs leading-relaxed text-fg-muted"><p className="mb-2 font-semibold text-fg">A shortlist that’s yours.</p>Save interesting roles and come back when you’re ready. Saved jobs stay in this browser.</div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div><p className="section-eyebrow mb-1">{filters.country === 'all' ? 'Across borders. Across possibilities.' : filters.country === 'worldwide' ? 'Work from anywhere' : filters.country}</p><h2 className="font-display text-2xl font-semibold tracking-tight text-fg">{filters.saved ? 'Your saved jobs' : jobSections.find((section) => section.id === filters.section)?.label}</h2></div>
          <button type="button" aria-pressed={filters.saved} onClick={() => update({ saved: filters.saved ? null : 'true' })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-fg hover:border-accent">{filters.saved ? 'Browse jobs' : 'Saved jobs'}<span className="rounded-full bg-accent-soft px-2 py-0.5 text-accent">{savedCount}</span></button>
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="min-w-0 break-words text-sm text-fg-muted"><strong className="font-semibold text-fg">{visible.length}</strong> {visible.length === 1 ? 'opportunity' : 'opportunities'}{filters.query && <> matching “{filters.query}”</>}</p>
          <div className="flex items-center gap-3">{hasFilters && <button type="button" onClick={clear} className="text-xs font-semibold text-accent hover:underline">Clear filters</button>}<label htmlFor="jobs-sort" className="sr-only">Sort jobs</label><select id="jobs-sort" value={filters.sort} onChange={(event) => update({ sort: event.target.value })} className="min-h-10 rounded-lg border border-border bg-surface px-2 text-xs text-fg"><option value="newest">Newest first</option><option value="company">Company A–Z</option></select></div>
        </div>
        {storageError && <p role="status" className="mb-4 text-sm text-fg-muted">Your browser couldn’t store this shortlist. Your changes will remain available for this session.</p>}
        {filters.saved && missingSaved > 0 && <p className="mb-4 text-sm text-fg-muted">{missingSaved} saved {missingSaved === 1 ? 'listing is' : 'listings are'} not present in the current feed results. {failedSources.length ? 'Some employer feeds are unavailable.' : 'The employer may have removed or changed the opening.'}</p>}
        {visible.length ? <ul id="jobs-results" aria-label="Job opportunities" className="space-y-4">
          {visible.slice(0, count).map((job) => {
            const status = jobStatus(job, now);
            return <li key={job.id}><article className="job-card" data-job-id={job.id}>
              <div className="flex items-start gap-4">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/10 bg-accent-soft font-display text-lg font-semibold text-accent">{job.company.split(/\s+/).slice(0, 2).map((word) => word[0]).join('')}</span>
                <div className="min-w-0 flex-1"><p className="mb-1 text-xs font-medium text-fg-muted">{job.company}</p><h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-fg"><Link href={`/jobs/${job.id}?from=${encodeURIComponent(params.toString())}`} className="hover:text-accent">{job.title}</Link></h3><p className="mt-2 text-xs text-fg-muted">{jobLocation(job)}{job.arrangement !== 'Not specified' && !job.worldwide ? ` · ${job.arrangement}` : ''}</p></div>
                <JobSaveButton id={job.id} title={job.title} />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-fg-muted">{job.summary}</p>
              <div className="my-4 flex flex-wrap gap-2">{job.employment.map((type) => <span key={type} className="job-badge">{jobSections.find((section) => section.id === type)?.label}</span>)}{job.skills.map((skill) => <span key={skill} className="rounded-md bg-surface-muted px-2 py-1 text-[11px] text-fg-muted">{skill}</span>)}{status !== 'open' && <span className="job-badge">{status === 'closed' ? 'Closed' : 'Awaiting recheck'}</span>}</div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div><p className="text-sm font-semibold text-fg">{job.compensation ?? 'Pay not specified'}</p><p className="mt-1 text-[11px] text-fg-muted">{job.postedAt ? `Posted ${date(job.postedAt)}` : `Source checked ${date(job.checkedAt)}`}</p></div><Link href={`/jobs/${job.id}?from=${encodeURIComponent(params.toString())}`} className="inline-flex min-h-10 items-center gap-4 rounded-full border border-border px-4 text-xs font-semibold text-accent hover:border-accent">View job <span aria-hidden="true">↗</span><span className="sr-only">: {job.title}</span></Link></div>
            </article></li>;
          })}
        </ul> : <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center"><p className="mb-3 font-display text-xl font-semibold text-fg">{filters.saved && !savedCount ? 'Your next opportunity could be worth saving.' : 'No matching opportunities right now.'}</p><p className="mx-auto max-w-md text-sm leading-relaxed text-fg-muted">{filters.saved && !savedCount ? 'Save a job while browsing to keep it here for later.' : 'Try another section, broaden your country selection, or clear your filters.'}</p><button type="button" onClick={hasFilters ? clear : () => update({ saved: null, section: 'fulltime' })} className="mt-5 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-accent-fg">{hasFilters ? 'Clear filters' : 'Explore full-time jobs'}</button></div>}
        {count < visible.length && <div className="mt-6 text-center"><button type="button" aria-controls="jobs-results" onClick={() => setExpanded({ key, count: count + 10 })} className="rounded-full border border-border bg-surface px-6 py-3 text-sm font-semibold text-fg">Load more jobs</button></div>}
        <p className="mt-6 text-xs leading-relaxed text-fg-muted">Published openings from connected Greenhouse and Lever employer boards. Newest sorting uses posting dates where provided, then fetch dates. Remote roles may also appear in another section. Titles and employer metadata determine category labels; confirm all terms with the employer.</p>
      </div>
    </div>
  </section>;
}
