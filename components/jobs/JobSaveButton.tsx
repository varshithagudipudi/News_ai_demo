'use client';

import { toggleSavedJob, useSavedJobs } from '@/lib/hooks/useSavedJobs';
export function JobSaveButton({ id, title }: { id: string; title: string }) {
  const { savedIds } = useSavedJobs();
  const saved = savedIds.includes(id);
  return <button type="button" aria-label={`${saved ? 'Unsave' : 'Save'} ${title}`} aria-pressed={saved} onClick={() => toggleSavedJob(id)} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${saved ? 'border-accent/30 bg-accent-soft text-accent' : 'border-border text-fg-muted hover:border-accent hover:text-accent'}`}>
    <svg aria-hidden="true" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" className="h-4 w-4"><path d="M6 4h12v16l-6-4-6 4z" /></svg>
  </button>;
}
