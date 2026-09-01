import { afterEach, describe, expect, it } from 'vitest';
import { createLocalRepository } from '@/lib/db/localRepository';

/**
 * Guards the "no overlapping collection runs" rule. Only the lock file under
 * `.data/` is touched — stored articles are left alone.
 */

const repository = createLocalRepository();
const LOCK = 'test-collection-lock';

afterEach(async () => {
  await repository.releaseLock(LOCK);
});

describe('collection lock', () => {
  it('grants the lock to the first caller and refuses the second', async () => {
    expect(await repository.acquireLock(LOCK, 60_000)).toBe(true);
    expect(await repository.acquireLock(LOCK, 60_000)).toBe(false);
  });

  it('grants the lock again once it has been released', async () => {
    expect(await repository.acquireLock(LOCK, 60_000)).toBe(true);
    await repository.releaseLock(LOCK);
    expect(await repository.acquireLock(LOCK, 60_000)).toBe(true);
  });

  it('lets an expired lock be taken over, so a crashed run self-heals', async () => {
    expect(await repository.acquireLock(LOCK, 1)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(await repository.acquireLock(LOCK, 60_000)).toBe(true);
  });

  it('only one of many concurrent attempts succeeds', async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () => repository.acquireLock(LOCK, 60_000)),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });
});
