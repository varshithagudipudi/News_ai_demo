import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JobsBoard } from '@/components/jobs/JobsBoard';
import { getLiveJobs } from '@/lib/jobs/live';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'AI Jobs', description: 'Discover AI internships, full-time roles, remote jobs, and freelance opportunities by country.' };
async function LiveBoard() {
  return <JobsBoard initialData={await getLiveJobs()} />;
}
export default function JobsPage() {
  return <Suspense fallback={<div role="status" className="px-6 py-12 text-fg-muted">Fetching current employer openings…</div>}><LiveBoard /></Suspense>;
}
