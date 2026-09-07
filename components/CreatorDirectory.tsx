'use client';

import { useMemo, useState } from 'react';
import { CreatorCard } from '@/components/CreatorCard';
import {
  CREATOR_FILTER_ALL,
  CreatorFilters,
  emptyCreatorFilters,
  type CreatorFilterValues,
} from '@/components/CreatorFilters';
import { EmptyState } from '@/components/states/EmptyState';
import { creatorGroups, creators } from '@/lib/config/creators';

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function CreatorDirectory() {
  const [filters, setFilters] = useState<CreatorFilterValues>(emptyCreatorFilters);

  const platforms = useMemo(
    () => uniqueSorted(creators.map((creator) => creator.platform)),
    [],
  );
  const focusAreas = useMemo(
    () => uniqueSorted(creators.flatMap((creator) => creator.focusAreas)),
    [],
  );
  const skillLevels = useMemo(
    () => uniqueSorted(creators.map((creator) => creator.skillLevel)),
    [],
  );

  const filtered = useMemo(() => {
    return creators.filter((creator) => {
      if (
        filters.platform !== CREATOR_FILTER_ALL &&
        creator.platform !== filters.platform
      ) {
        return false;
      }
      if (
        filters.focusArea !== CREATOR_FILTER_ALL &&
        !creator.focusAreas.includes(filters.focusArea)
      ) {
        return false;
      }
      if (
        filters.skillLevel !== CREATOR_FILTER_ALL &&
        creator.skillLevel !== filters.skillLevel
      ) {
        return false;
      }
      return true;
    });
  }, [filters]);

  const groupedEntries = useMemo(() => {
    return creatorGroups
      .map((group) => ({
        group,
        members: filtered.filter((creator) => creator.group === group.slug),
      }))
      .filter((entry) => entry.members.length > 0);
  }, [filtered]);

  return (
    <section aria-labelledby="creators-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b-2 border-fg pb-3">
        <div>
          <h2
            id="creators-heading"
            className="text-xl font-extrabold uppercase tracking-tight text-fg"
          >
            AI Content Creators
          </h2>
          <p className="text-sm text-fg-muted">
            {filtered.length} {filtered.length === 1 ? 'creator' : 'creators'}{' '}
            across {groupedEntries.length}{' '}
            {groupedEntries.length === 1 ? 'category' : 'categories'}
          </p>
        </div>
        <CreatorFilters
          platforms={platforms}
          focusAreas={focusAreas}
          skillLevels={skillLevels}
          value={filters}
          onChange={setFilters}
        />
      </div>

      {groupedEntries.length === 0 ? (
        <EmptyState
          title="No creators found"
          message="No creators match these filters yet. Try a different combination or clear the filters."
          actionLabel="Clear filters"
          onAction={() => setFilters(emptyCreatorFilters)}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {groupedEntries.map(({ group, members }) => (
            <div key={group.slug}>
              <h3 className="mb-3 text-base font-extrabold uppercase tracking-tight text-fg">
                {group.name}
              </h3>
              <ul
                aria-label={group.name}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {members.map((creator) => (
                  <li key={creator.name} className="h-full">
                    <CreatorCard creator={creator} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
