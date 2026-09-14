import { describe, expect, it } from 'vitest';
import { creatorGroups, creators } from '@/lib/config/creators';
import audit from '@/docs/creator-link-audit.json';

describe('creator directory data', () => {
  it.each(creatorGroups)('has 50 distinct entries for $name', (group) => {
    const members = creators.filter((creator) => creator.group === group.slug);
    expect(members).toHaveLength(50);
    expect(new Set(members.map((creator) => creator.url)).size).toBe(50);
    expect(new Set(members.map((creator) => creator.name)).size).toBe(50);
  });
  it('uses direct public destinations with a matching source check', () => {
    for (const creator of creators) {
      const url = new URL(creator.url);
      expect(['http:', 'https:']).toContain(url.protocol);
      expect(url.hostname).not.toBe('example.com');
      expect(url.pathname).not.toMatch(/\/search|\/results/);
      expect(audit.some((entry) => entry.url === creator.url && entry.name === creator.name)).toBe(true);
    }
  });
});
