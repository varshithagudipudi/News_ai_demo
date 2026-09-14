import { describe, expect, it, vi } from 'vitest';
import { articleContext, cosineSimilarity, createSemanticDeduplicator, semanticFailureReason, type SemanticServices } from '@/lib/news/semanticDeduplicate';
import type { ArticleFingerprint } from '@/lib/db/repository';
import { normalizeTitle } from '@/lib/news/normalize';

function article(title: string, overrides: Partial<ArticleFingerprint> = {}): ArticleFingerprint {
  return { title, normalizedTitle: normalizeTitle(title), description: 'India home cricket associate sponsorship announcement.',
    articleUrl: `https://example.com/${encodeURIComponent(title)}`, sourceName: 'News',
    publishedAt: '2026-09-09T00:00:00Z', ...overrides };
}
const bcci = article('BCCI announces Campa, SBI Life and ChatGPT as Associate Partners for India Home Cricket');
const reworded = article('BCCI signs Campa, SBI Life, ChatGPT in Rs 130 crore sponsorship deal');
function mockServices(decision: 'same_event' | 'different_event' | 'uncertain' = 'same_event'): SemanticServices {
  return { embed: vi.fn().mockResolvedValue([1, 0]), confirm: vi.fn().mockResolvedValue({ decision, reason: 'Compared event and participants.' }) };
}

describe('semantic duplicate pipeline', () => {
  it('reports actionable errors without exposing arbitrary error contents', () => {
    expect(semanticFailureReason(new Error('Gemini API returned 429'))).toContain('quota exhausted');
    expect(semanticFailureReason(new Error('Embedding cache unavailable; apply migration 0002.'))).toContain('migration 0002');
    expect(semanticFailureReason(new Error('secret-key-in-response'))).not.toContain('secret-key');
  });
  it('routes the BCCI wording variation through event confirmation, with description and date', async () => {
    const services = mockServices();
    const result = await createSemanticDeduplicator({ services }).deduplicate([reworded], [bcci]);
    expect(result.duplicates).toEqual([reworded]);
    expect(result.matches[0].retained).toEqual(bcci);
    expect(services.confirm).toHaveBeenCalledWith(reworded, bcci);
    expect(articleContext(bcci)).toEqual({ headline: bcci.title, description: bcci.description, publishedAt: bcci.publishedAt });
  });
  it.each(['different_event', 'uncertain'] as const)('keeps signing versus cancellation when confirmation returns %s, despite identical vectors', async (decision) => {
    const services = mockServices(decision);
    const cancellation = article('BCCI cancels Campa, SBI Life, ChatGPT sponsorship deal');
    const result = await createSemanticDeduplicator({ services }).deduplicate([cancellation], [bcci]);
    expect(result.unique).toEqual([cancellation]);
    expect(result.matches).toEqual([]);
  });
  it('deduplicates within a batch and always references a retained article', async () => {
    const result = await createSemanticDeduplicator({ services: mockServices() }).deduplicate([bcci, reworded], []);
    expect(result.unique).toEqual([bcci]);
    expect(result.matches[0].retained).toBe(bcci);
  });
  it('skips exact matches without API calls', async () => {
    const services = mockServices();
    const copy = { ...bcci, articleUrl: 'https://other.com/story' };
    const result = await createSemanticDeduplicator({ services }).deduplicate([copy], [bcci]);
    expect(result.duplicates).toEqual([copy]);
    expect(services.embed).not.toHaveBeenCalled();
  });
  it('does not apply the old fuzzy word matcher without confirmation', async () => {
    const first = article('OpenAI launches new AI tools for developers');
    const second = article('OpenAI unveils AI tools for developers today');
    const services = mockServices('uncertain');
    const result = await createSemanticDeduplicator({ services }).deduplicate([second], [first]);
    expect(result.unique).toEqual([second]);
    expect(services.confirm).toHaveBeenCalled();
  });
  it('keeps articles beyond 72 hours and invalid dates without semantic calls', async () => {
    const services = mockServices();
    const later = { ...reworded, publishedAt: '2026-09-12T00:00:00.001Z' };
    const invalid = { ...reworded, articleUrl: 'https://other.com/invalid', publishedAt: 'invalid' };
    const result = await createSemanticDeduplicator({ services }).deduplicate([later, invalid], [bcci]);
    expect(result.unique).toEqual([later, invalid]);
    expect(services.embed).not.toHaveBeenCalled();
  });
  it('compares exactly at the 72-hour boundary', async () => {
    const services = mockServices();
    await createSemanticDeduplicator({ services }).deduplicate([{ ...reworded, publishedAt: '2026-09-12T00:00:00Z' }], [bcci]);
    expect(services.confirm).toHaveBeenCalled();
  });
  it('keeps unreviewed articles on API failure and opens the circuit breaker', async () => {
    const services = mockServices();
    vi.mocked(services.embed).mockRejectedValue(new Error('outage'));
    const deduper = createSemanticDeduplicator({ services });
    const batch = [reworded, article('BCCI announces another development')];
    expect((await deduper.deduplicate(batch, [bcci])).unique).toEqual(batch);
    expect(services.embed).toHaveBeenCalledTimes(1);
    expect(deduper.warnings.size).toBe(1);
  });
  it('keeps candidates after the confirmation budget is exhausted', async () => {
    const services = mockServices('uncertain');
    const deduper = createSemanticDeduplicator({ services, maxChecks: 1 });
    const batch = [reworded, article('BCCI announces another development')];
    expect((await deduper.deduplicate(batch, [bcci])).unique).toEqual(batch);
    expect(services.confirm).toHaveBeenCalledTimes(1);
    expect(deduper.warnings.size).toBe(1);
  });
  it('does not send low-similarity articles for confirmation', async () => {
    const services = mockServices();
    vi.mocked(services.embed).mockResolvedValueOnce([1, 0]).mockResolvedValueOnce([0, 1]);
    expect((await createSemanticDeduplicator({ services }).deduplicate([reworded], [bcci])).unique).toEqual([reworded]);
    expect(services.confirm).not.toHaveBeenCalled();
  });
  it('handles cosine similarity and invalid vectors', () => {
    expect(cosineSimilarity([1, 2], [2, 4])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(-1);
    expect(cosineSimilarity([1], [1, 2])).toBe(-1);
  });
});
