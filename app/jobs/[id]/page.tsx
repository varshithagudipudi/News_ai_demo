import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JobSaveButton } from '@/components/jobs/JobSaveButton';
import { jobLocation, jobSections, jobStatus } from '@/lib/jobs/catalog';
import { getLiveJob } from '@/lib/jobs/live';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getLiveJob(id);
  return { title: job ? `${job.title} at ${job.company}` : 'Job not found' };
}
export default async function JobPage({ params, searchParams }: Props) {
  const { id } = await params;
  const job = await getLiveJob(id);
  if (!job) notFound();
  const { from } = await searchParams;
  const back = typeof from === 'string' ? new URLSearchParams(from).toString() : `section=${job.employment[0]}`;
  const status = jobStatus(job, new Date().toISOString());
  return <article id="job-detail" className="px-4 py-8 sm:px-6">
    <Link href={`/jobs?${back}`} className="text-sm font-medium text-accent hover:underline">← Back to opportunities</Link>
    <div className="jobs-hero mt-6">
      <div className="relative flex items-start justify-between gap-4"><div className="min-w-0"><p className="section-eyebrow mb-3">{job.company}</p><h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">{job.title}</h1><p className="mt-4 text-sm text-fg-muted">{jobLocation(job)}</p></div><JobSaveButton id={job.id} title={job.title} /></div>
      <div className="relative mt-5 flex flex-wrap gap-2">{job.employment.map((type) => <span key={type} className="job-badge">{jobSections.find((section) => section.id === type)?.label}</span>)}<span className="job-badge">{job.arrangement === 'Not specified' ? 'Work arrangement not specified' : job.arrangement}</span></div>
    </div>
    <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-fg">The opportunity</h2><p className="mt-4 text-base leading-relaxed text-fg-muted">{job.summary}</p>
        {[{ title: 'What you’ll work on', items: job.responsibilities }, { title: 'What you’ll bring', items: job.requirements }].filter((section) => section.items.length > 0).map((section) => <section key={section.title} className="mt-8"><h2 className="text-xl font-semibold text-fg">{section.title}</h2><ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-fg-muted">{section.items.map((item) => <li key={item}>{item}</li>)}</ul></section>)}
        <section className="mt-8"><h2 className="text-xl font-semibold text-fg">Location & eligibility</h2><p className="mt-4 text-sm leading-relaxed text-fg-muted">{job.eligibility}</p></section>
        {job.note && <p className="mt-6 rounded-xl bg-accent-soft p-4 text-sm leading-relaxed text-fg-muted">{job.note}</p>}
        <p className="mt-8 border-t border-border pt-5 text-xs leading-relaxed text-fg-muted">Retrieved from the employer’s {job.sourceName} feed. Read the <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline">original employer posting</a> for the full description, requirements, and application terms. Last fetched {new Date(job.checkedAt).toUTCString()}.</p>
      </div>
      <aside aria-label="Job overview" className="jobs-filter-panel p-6">
        <h2 className="text-lg font-semibold text-fg">At a glance</h2><dl className="mt-5 space-y-5">{[
          ['Compensation', job.compensation ?? 'Not specified'], ['Experience', job.experience], ['Specialization', job.specialization],
          ['Duration', job.duration ?? 'Not specified'], ['Application deadline', job.closesAt ?? 'Not specified'],
        ].map(([label, value]) => <div key={label}><dt className="text-xs text-fg-muted">{label}</dt><dd className="mt-1 text-sm font-medium text-fg">{value}</dd></div>)}</dl>
        {status === 'open' ? <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-7 flex min-h-12 items-center justify-center gap-3 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-fg hover:bg-accent/90">Apply on employer site <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : <p role="status" className="mt-7 rounded-xl bg-surface-muted p-4 text-sm text-fg-muted">{status === 'closed' ? 'This opportunity is closed.' : 'This listing is awaiting a new source check.'} Check the original posting for its current status.</p>}
        <p className="mt-3 text-center text-xs leading-relaxed text-fg-muted">Applications are handled by the employer.</p>
      </aside>
    </div>
  </article>;
}
