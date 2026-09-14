'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreatorAvatar, CreatorCard } from '@/components/CreatorCard';
import { CreatorFilters } from '@/components/CreatorFilters';
import { CreatorProfileDialog } from '@/components/CreatorProfileDialog';
import { EmptyState } from '@/components/states/EmptyState';
import { useSavedCreators } from '@/lib/hooks/useSavedCreators';
import {
  contentFormats, creatorProfiles, directoryTopics, emptyDirectoryFilters,
  filterCreatorProfiles, profileTypes, type CreatorProfile, type DirectoryFilters,
} from '@/lib/creators/directory';

const parameterNames = { query: 'creatorQuery', topic: 'creatorTopic', type: 'creatorType', format: 'creatorFormat', savedOnly: 'creatorSaved', order: 'creatorOrder' } as const;
const previewCreators = ['wolfe', 'karpathy', 'mollick'].map((id) => creatorProfiles.find((profile) => profile.id === id)!);

export function CreatorDirectory() {
  const params = useSearchParams();
  const { savedIds, toggleSaved, storageError } = useSavedCreators();
  const [expanded, setExpanded] = useState({ key: '', count: 12 });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<CreatorProfile | null>(null);
  const filters: DirectoryFilters = {
    query: params.get('creatorQuery') ?? '',
    topic: directoryTopics.some((topic) => topic.slug === params.get('creatorTopic')) ? params.get('creatorTopic')! : 'all',
    type: profileTypes.some((type) => type === params.get('creatorType')) ? params.get('creatorType')! : 'all',
    format: contentFormats.some((format) => format === params.get('creatorFormat')) ? params.get('creatorFormat')! : 'all',
    savedOnly: params.get('creatorSaved') === 'true',
    order: params.get('creatorOrder') === 'name' ? 'name' : 'directory',
  };
  const filterKey = JSON.stringify(filters);
  const filtered = useMemo(
    () => filterCreatorProfiles(JSON.parse(filterKey) as DirectoryFilters, savedIds),
    [filterKey, savedIds],
  );
  const visibleCount = Math.min(expanded.key === filterKey ? expanded.count : 12, filtered.length);
  const activeCount = Number(filters.type !== 'all') + Number(filters.format !== 'all');
  const hasFilters = Boolean(filters.query || filters.topic !== 'all' || activeCount);
  const savedCount = creatorProfiles.filter((profile) => savedIds.includes(profile.id)).length;

  function changeFilters(changes: Partial<DirectoryFilters>, replace = false) {
    const next = { ...filters, ...changes };
    const nextParams = new URLSearchParams(params.toString());
    for (const key of Object.keys(parameterNames) as (keyof DirectoryFilters)[]) {
      if (next[key] === emptyDirectoryFilters[key]) nextParams.delete(parameterNames[key]);
      else nextParams.set(parameterNames[key], String(next[key]));
    }
    const href = '/?' + nextParams.toString();
    if (replace) window.history.replaceState(null, '', href);
    else window.history.pushState(null, '', href);
  }

  function resetFilters() {
    changeFilters({ ...emptyDirectoryFilters, savedOnly: filters.savedOnly });
  }

  return (
    <section id="creator-directory" aria-labelledby="creators-heading" className="px-4 pb-16 pt-6 sm:px-6">
      <div className="creator-hero">
        <div className="relative z-10 min-w-0">
          <p className="section-eyebrow mb-4 flex items-center gap-2"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />The AI Pulse creator directory</p>
          <h1 id="creators-heading" className="max-w-3xl text-[34px] font-bold leading-[1.08] tracking-[-0.045em] text-fg sm:text-[44px] xl:text-[52px]">
            Find your next<br /><span className="text-accent">AI obsession.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-fg-muted sm:text-base">Discover the people and channels making AI easier to understand, build with, and explore.</p>
          <form role="search" aria-label="Search AI creators" className="creator-search mt-6" onSubmit={(event) => event.preventDefault()}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-5 w-5 shrink-0 text-accent"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
            <label htmlFor="site-search" className="sr-only">Search creators, topics, or channels</label>
            <input id="site-search" type="search" value={filters.query} onChange={(event) => changeFilters({ query: event.target.value }, true)} placeholder="Search creators, topics, or channels…" autoComplete="off" className="min-w-0 flex-1 bg-transparent py-3 text-base text-fg placeholder:text-fg-muted focus-visible:ring-offset-0" />
            {filters.query && <button type="button" aria-label="Clear creator search" onClick={() => changeFilters({ query: '' }, true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-surface-muted">✕</button>}
          </form>
          <p className="mt-2.5 text-xs text-fg-muted">Try a name, “AI agents”, or “machine learning”.</p>
        </div>
        <div className="creator-hero-note">
          <div className="mb-5 flex -space-x-3">{previewCreators.map((creator) => <CreatorAvatar key={creator.id} creator={creator} />)}</div>
          <p className="font-display text-2xl font-semibold leading-tight tracking-tight text-fg">Different voices.<br />A wider perspective.</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fg-muted">From your first AI workflow to your next research deep dive. Find a voice that speaks to you.</p>
          <div className="mt-6 flex gap-7 border-t border-border pt-5">
            <div><p className="font-display text-2xl font-semibold text-fg">{creatorProfiles.length}</p><p className="mt-1 text-xs text-fg-muted">voices & resources</p></div>
            <div><p className="font-display text-2xl font-semibold text-fg">{directoryTopics.length}</p><p className="mt-1 text-xs text-fg-muted">topics to explore</p></div>
          </div>
        </div>
      </div>

      <div aria-label="Creator topics" className="mb-7 flex gap-2 overflow-x-auto pb-2 pt-6">
        {[{ slug: 'all', label: 'All topics' }, ...directoryTopics].map((topic) => (
          <button key={topic.slug} type="button" aria-pressed={filters.topic === topic.slug} onClick={() => changeFilters({ topic: topic.slug })} className="creator-topic">
            {topic.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[230px_minmax(0,1fr)] xl:gap-8">
        <aside aria-label="Refine creator results" className="creator-filter-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="hidden font-display text-base font-semibold text-fg lg:block">Refine your discovery</h2>
            <button type="button" className="flex min-h-10 items-center gap-2 text-sm font-semibold text-fg lg:hidden" aria-expanded={filtersOpen} aria-controls="creator-filter-controls" onClick={() => setFiltersOpen(!filtersOpen)}>
              Filters{activeCount > 0 && <span className="rounded-full bg-accent-soft px-2 text-xs text-accent">{activeCount}</span>}<span aria-hidden="true">{filtersOpen ? '−' : '+'}</span>
            </button>
          </div>
          <div id="creator-filter-controls" className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}><CreatorFilters value={filters} onChange={changeFilters} /></div>
        </aside>

        <div className="min-w-0" id="creator-results">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <div role="group" aria-label="Directory view" className="flex gap-5">
              <button type="button" aria-pressed={!filters.savedOnly} onClick={() => changeFilters({ savedOnly: false })} className="creator-view-tab">Discover</button>
              <button type="button" aria-pressed={filters.savedOnly} onClick={() => changeFilters({ savedOnly: true })} className="creator-view-tab">Saved creators <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px]">{savedCount}</span></button>
            </div>
            <div className="flex items-center gap-2 pb-3 text-xs text-fg-muted">
              <label htmlFor="creator-order">Sort by</label>
              <select id="creator-order" value={filters.order} onChange={(event) => changeFilters({ order: event.target.value })} className="min-h-10 rounded-lg border border-border bg-surface px-2 text-xs text-fg">
                <option value="directory">Directory order</option><option value="name">Name A–Z</option>
              </select>
            </div>
          </div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <p role="status" aria-live="polite" className="text-sm text-fg-muted"><strong className="font-semibold text-fg">{filtered.length}</strong> {filtered.length === 1 ? 'profile' : 'profiles'}{filters.query.trim() && <> matching “{filters.query.trim()}”</>}</p>
            {hasFilters && <button type="button" onClick={resetFilters} className="text-xs font-semibold text-accent hover:underline">Clear filters</button>}
          </div>
          {hasFilters && <div aria-label="Active creator filters" className="mb-5 flex flex-wrap gap-2">
            {filters.topic !== 'all' && <button type="button" className="creator-tag" onClick={() => changeFilters({ topic: 'all' })}>{directoryTopics.find((topic) => topic.slug === filters.topic)?.label}<span aria-hidden="true"> ×</span><span className="sr-only"> Remove topic filter</span></button>}
            {filters.type !== 'all' && <button type="button" className="creator-tag" onClick={() => changeFilters({ type: 'all' })}>{filters.type}<span aria-hidden="true"> ×</span><span className="sr-only"> Remove type filter</span></button>}
            {filters.format !== 'all' && <button type="button" className="creator-tag" onClick={() => changeFilters({ format: 'all' })}>{filters.format}<span aria-hidden="true"> ×</span><span className="sr-only"> Remove format filter</span></button>}
          </div>}
          {storageError && <p role="status" className="mb-4 rounded-lg border border-border p-3 text-sm text-fg-muted">Your browser couldn’t save this shortlist. Your choices will remain available until you leave this page.</p>}
          {filtered.length > 0 ? (
            <>
              <ul id="creator-grid" aria-label="Creator profiles" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, visibleCount).map((creator) => (
                  <li key={creator.id} className="min-w-0"><CreatorCard creator={creator} saved={savedIds.includes(creator.id)} onToggle={() => toggleSaved(creator.id)} onOpen={() => setSelected(creator)} /></li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col items-center gap-3">
                <p className="text-xs text-fg-muted">Showing {visibleCount} of {filtered.length} profiles</p>
                {visibleCount < filtered.length && <button type="button" aria-controls="creator-grid" onClick={() => setExpanded({ key: filterKey, count: visibleCount + 12 })} className="rounded-full border border-border bg-surface px-7 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent">Load more creators <span aria-hidden="true">↓</span></button>}
              </div>
            </>
          ) : <EmptyState
            title={filters.savedOnly && savedCount === 0 ? 'Your next favorite belongs here.' : 'No matching creators yet.'}
            message={filters.savedOnly && savedCount === 0 ? 'Save a profile while exploring to build your own AI reading and learning list.' : 'Try a broader topic, a different name, or fewer filters.'}
            actionLabel={filters.savedOnly && savedCount === 0 ? 'Discover creators' : 'Clear filters'}
            onAction={filters.savedOnly && savedCount === 0 ? () => changeFilters(emptyDirectoryFilters) : resetFilters}
          />}
          <details className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-fg-muted">
            <summary className="w-fit cursor-pointer font-semibold text-fg">About this directory</summary>
            <p className="mt-3 max-w-2xl">Explore individuals, publications, communities, and company learning resources. Profiles appear once across multiple topics. Topic and content labels are editorial guidance based on the listed work; directory order is not a ranking. Save profiles to keep a shortlist in this browser.</p>
          </details>
        </div>
      </div>
      {selected && <CreatorProfileDialog creator={selected} saved={savedIds.includes(selected.id)} onToggle={() => toggleSaved(selected.id)} onClose={() => setSelected(null)} />}
    </section>
  );
}
