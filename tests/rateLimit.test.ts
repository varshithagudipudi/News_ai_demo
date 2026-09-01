import { beforeEach, describe, expect, it } from 'vitest';
import { rateLimit, resetRateLimits } from '@/lib/api/rateLimit';

describe('rateLimit', () => {
  beforeEach(() => resetRateLimits());

  it('allows requests up to the limit and blocks the next one', () => {
    const start = 1_000_000;
    expect(rateLimit('k', 2, 60_000, start).allowed).toBe(true);
    expect(rateLimit('k', 2, 60_000, start + 1).allowed).toBe(true);
    expect(rateLimit('k', 2, 60_000, start + 2).allowed).toBe(false);
  });

  it('reports a positive retry-after once blocked', () => {
    const start = 1_000_000;
    rateLimit('k', 1, 60_000, start);
    const blocked = rateLimit('k', 1, 60_000, start + 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('starts a fresh window after the current one expires', () => {
    const start = 1_000_000;
    rateLimit('k', 1, 60_000, start);
    expect(rateLimit('k', 1, 60_000, start + 60_001).allowed).toBe(true);
  });

  it('tracks keys independently', () => {
    const start = 1_000_000;
    rateLimit('a', 1, 60_000, start);
    expect(rateLimit('b', 1, 60_000, start).allowed).toBe(true);
  });
});
