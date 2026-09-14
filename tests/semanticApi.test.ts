import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSemanticServices, geminiErrorHint, semanticFailureReason } from '@/lib/news/semanticDeduplicate';

const cache = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock('@/lib/ai/embeddingCache', () => ({ createEmbeddingCache: () => cache }));
vi.mock('@/lib/config/env', () => ({ getEnv: () => ({ GEMINI_API_KEY: 'test-key', GEMINI_DEDUP_MODEL: 'gemini-3.1-flash-lite' }) }));
const article = { title: 'BCCI signs sponsorship deal', normalizedTitle: 'bcci signs sponsorship deal',
  description: 'Campa, SBI Life and ChatGPT join as partners.',
  publishedAt: '2026-09-09T00:00:00Z', sourceName: 'News', articleUrl: 'https://example.com/story' };
const vector = Array.from({ length: 1536 }, (_, index) => index === 0 ? 1 : 0);
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });

describe('semantic API boundary', () => {
  it('reports an invalid key and operation without exposing the response message', async () => {
    cache.get.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { message: 'private-value', details: [{ reason: 'API_KEY_INVALID' }] },
    }), { status: 400 })));
    let warning = '';
    try { await createSemanticServices().embed(article); }
    catch (error) { warning = semanticFailureReason(error); }
    expect(warning).toContain('Embedding request');
    expect(warning).toContain('as invalid');
    expect(warning).not.toContain('private-value');
    expect(geminiErrorHint({ error: { message: 'arbitrary secret text' } })).toBe('');
  });
  it('reuses persistent embeddings across service instances without requesting them again', async () => {
    cache.get.mockResolvedValue(vector);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await createSemanticServices().embed(article)).toEqual(vector);
    expect(await createSemanticServices().embed(article)).toEqual(vector);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('embeds headline and description and invalidates the cache key when content changes', async () => {
    cache.get.mockResolvedValue(null);
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ embedding: { values: vector } })));
    vi.stubGlobal('fetch', fetch);
    await createSemanticServices().embed(article);
    expect(cache.set).toHaveBeenCalledWith(expect.any(String), vector);
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.content.parts[0].text).toContain(article.title);
    expect(body.content.parts[0].text).toContain(article.description);
    expect(body.outputDimensionality).toBe(1536);
    expect(body.taskType).toBe('SEMANTIC_SIMILARITY');
    expect(fetch.mock.calls[0][0]).toContain('generativelanguage.googleapis.com');
    expect(fetch.mock.calls[0][1].headers['x-goog-api-key']).toBe('test-key');
    const key = cache.get.mock.calls[0][0];
    cache.get.mockResolvedValue(vector);
    await createSemanticServices().embed({ ...article, description: 'Changed details' });
    expect(cache.get.mock.calls[1][0]).not.toEqual(key);
  });
  it.each([
    { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"decision":"same_event","reason":"same"}' }] } }] },
    { promptFeedback: { blockReason: 'SAFETY' } },
    { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"decision":"same_event"}' }] } }] },
    { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'invalid JSON' }] } }] },
  ])('rejects incomplete or malformed confirmation responses', async (response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(response))));
    await expect(createSemanticServices().confirm(article, article)).rejects.toThrow();
  });
  it('sends dates and descriptions and parses a structured event decision', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ candidates: [{ finishReason: 'STOP',
      content: { parts: [{ text: JSON.stringify({ decision: 'different_event', reason: 'Cancellation is a new development.' }) }] } }] })));
    vi.stubGlobal('fetch', fetch);
    const result = await createSemanticServices().confirm(article, { ...article, title: 'BCCI cancels sponsorship deal' });
    expect(result.decision).toBe('different_event');
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(JSON.parse(body.contents[0].parts[0].text).a).toEqual({ headline: article.title, description: article.description, publishedAt: article.publishedAt });
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.generationConfig.responseJsonSchema.required).toEqual(['decision', 'reason']);
  });
  it('rejects a malformed embedding instead of caching it', async () => {
    cache.get.mockResolvedValue(null);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ embedding: { values: [0, 0] } }))));
    await expect(createSemanticServices().embed(article)).rejects.toThrow();
    expect(cache.set).not.toHaveBeenCalled();
  });
  it('reports quota exhaustion without retrying or calling a paid fallback', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 429 }));
    vi.stubGlobal('fetch', fetch);
    await expect(createSemanticServices().confirm(article, article)).rejects.toThrow('Gemini API returned 429');
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
