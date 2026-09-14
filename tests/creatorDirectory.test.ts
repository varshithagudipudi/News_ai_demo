import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CreatorDirectory } from '@/components/CreatorDirectory';
import { creatorProfiles, directoryTopics, emptyDirectoryFilters, filterCreatorProfiles } from '@/lib/creators/directory';
import { readSavedCreatorIds } from '@/lib/hooks/useSavedCreators';

vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams('category=ai-content-creators') }));

afterEach(() => vi.unstubAllGlobals());
describe('creator directory initial display', () => {
  it('renders a single searchable directory with 12 unique profiles and progressive loading', () => {
    // The app uses Next's JSX runtime; Vitest's default transform uses React.
    vi.stubGlobal('React', React);
    const html = renderToStaticMarkup(React.createElement(CreatorDirectory));
    expect(html.match(/<article\b/g)).toHaveLength(12);
    expect(html.match(/id="site-search"/g)).toHaveLength(1);
    expect(html).toContain('Load more creators');
    expect(html).toContain('Saved creators');
    expect(html).toContain('Matt Wolfe');
  });
});

describe('creator discovery', () => {
  it('shows every profile once and preserves all category memberships', () => {
    expect(new Set(creatorProfiles.map((profile) => profile.id)).size).toBe(creatorProfiles.length);
    expect(new Set(creatorProfiles.map((profile) => profile.url)).size).toBe(creatorProfiles.length);
    for (const topic of directoryTopics) {
      expect(filterCreatorProfiles({ ...emptyDirectoryFilters, topic: topic.slug })).toHaveLength(50);
    }
  });
  it('matches accents, case, and multiple search words across profile information', () => {
    expect(filterCreatorProfiles({ ...emptyDirectoryFilters, query: 'AURELIEN GERON' }).map((profile) => profile.id)).toEqual(['aurelien']);
    expect(filterCreatorProfiles({ ...emptyDirectoryFilters, query: 'sabrina agents' }).map((profile) => profile.id)).toEqual(['sabrina']);
    expect(filterCreatorProfiles({ ...emptyDirectoryFilters, query: 'unmatched-query-123' })).toEqual([]);
  });
  it('combines topic, type, format, and saved filters', () => {
    const result = filterCreatorProfiles({ ...emptyDirectoryFilters, topic: 'ai-coding', type: 'Individual creators', format: 'Code & projects', savedOnly: true }, ['cole', 'rundown']);
    expect(result.map((profile) => profile.id)).toEqual(['cole']);
    expect(filterCreatorProfiles({ ...emptyDirectoryFilters, savedOnly: true }, [])).toEqual([]);
  });
  it('sorts by name without changing the source order', () => {
    const firstId = creatorProfiles[0].id;
    const result = filterCreatorProfiles({ ...emptyDirectoryFilters, order: 'name' });
    expect(result.map((profile) => profile.name)).toEqual(result.map((profile) => profile.name).sort((a, b) => a.localeCompare(b)));
    expect(creatorProfiles[0].id).toBe(firstId);
  });
  it('handles damaged or duplicate saved data', () => {
    expect(readSavedCreatorIds('broken json')).toEqual([]);
    expect(readSavedCreatorIds('{"id":"cole"}')).toEqual([]);
    expect(readSavedCreatorIds('["cole",null,32,"cole","wolfe"]')).toEqual(['cole', 'wolfe']);
  });
});
