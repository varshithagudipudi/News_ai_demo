import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectNews } from '@/lib/news/collectNews';

const mocks = vi.hoisted(() => ({
  acquireLock: vi.fn(),
  releaseLock: vi.fn(),
  deletePublishedBefore: vi.fn(),
  findRecentFingerprints: vi.fn(),
  searchNews: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ getRepository: () => mocks }));
vi.mock('@/lib/news/gnewsClient', () => ({ searchNews: mocks.searchNews }));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

describe('collection retention', () => {
  it('cleans up before provider failures and releases the lock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.acquireLock.mockResolvedValue(true);
    mocks.deletePublishedBefore.mockResolvedValue(3);
    mocks.findRecentFingerprints.mockResolvedValue([]);
    mocks.searchNews.mockRejectedValue(new Error('Provider unavailable'));

    await collectNews();

    expect(mocks.deletePublishedBefore).toHaveBeenCalledWith('2025-10-17T12:00:00.000Z');
    expect(mocks.deletePublishedBefore.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.searchNews.mock.invocationCallOrder[0],
    );
    expect(mocks.releaseLock).toHaveBeenCalledWith('collect-news');
  });

  it('surfaces cleanup failures and still releases the lock', async () => {
    mocks.acquireLock.mockResolvedValue(true);
    mocks.deletePublishedBefore.mockRejectedValue(new Error('Cleanup failed'));
    await expect(collectNews()).rejects.toThrow('Cleanup failed');
    expect(mocks.searchNews).not.toHaveBeenCalled();
    expect(mocks.releaseLock).toHaveBeenCalledWith('collect-news');
  });
});
