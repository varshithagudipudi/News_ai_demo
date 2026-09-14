'use client';

import { contentFormats, profileTypes, type DirectoryFilters } from '@/lib/creators/directory';

export function CreatorFilters({ value, onChange }: {
  value: DirectoryFilters; onChange: (changes: Partial<DirectoryFilters>) => void;
}) {
  return (
    <div className="space-y-6 pt-5">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-fg-muted">Who to discover</legend>
        <div className="space-y-1">
          {['all', ...profileTypes].map((type) => (
            <label key={type} className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-sm ${value.type === type ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:bg-surface-muted'}`}>
              <input type="radio" name="creator-type" value={type} checked={value.type === type} onChange={() => onChange({ type })} className="h-4 w-4 shrink-0 accent-accent" />
              {type === 'all' ? 'Everyone' : type}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="creator-format" className="mb-3 block text-xs font-semibold uppercase tracking-wider text-fg-muted">How you like to learn</label>
        <select id="creator-format" value={value.format} onChange={(event) => onChange({ format: event.target.value })} className="h-11 w-full min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-fg">
          <option value="all">All content formats</option>
          {contentFormats.map((format) => <option key={format}>{format}</option>)}
        </select>
      </div>
      <div className="rounded-xl bg-accent-soft p-4">
        <p className="font-display text-sm font-semibold text-fg">Find your kind of insight.</p>
        <p className="mt-2 text-xs leading-relaxed text-fg-muted">Explore a topic, read a profile, and save the voices you want to come back to.</p>
      </div>
    </div>
  );
}
