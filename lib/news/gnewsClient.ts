import 'server-only';
import { requireEnv } from '@/lib/config/env';

/**
 * Minimal GNews search client.
 *
 * The API key is read from the server environment on every call and is never
 * included in an error message, a log line or a thrown stack.
 */

const ENDPOINT = 'https://gnews.io/api/v4/search';
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 800;

export interface GNewsArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string | null };
}

export interface GNewsSearchOptions {
  query: string;
  max: number;
  /** ISO timestamp; results older than this are not requested. */
  from?: string;
  lang?: string;
  signal?: AbortSignal;
}

export class GNewsError extends Error {
  readonly status: number;
  readonly retryable: boolean;

  constructor(message: string, status: number, retryable: boolean) {
    super(message);
    this.name = 'GNewsError';
    this.status = status;
    this.retryable = retryable;
  }
}

/** Removes anything that could carry the API key out of an error message. */
function safeMessage(status: number): string {
  switch (status) {
    case 401:
    case 403:
      return 'GNews rejected the request (check GNEWS_API_KEY and plan limits).';
    case 429:
      return 'GNews rate limit reached for this key.';
    default:
      return `GNews request failed with status ${status}.`;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Defensively maps the provider payload; malformed entries are dropped. */
function parseArticles(payload: unknown): GNewsArticle[] {
  if (!isRecord(payload) || !Array.isArray(payload.articles)) return [];

  const results: GNewsArticle[] = [];
  for (const entry of payload.articles) {
    if (!isRecord(entry)) continue;
    const source = isRecord(entry.source) ? entry.source : {};

    if (typeof entry.title !== 'string' || typeof entry.url !== 'string') {
      continue;
    }

    results.push({
      title: entry.title,
      description:
        typeof entry.description === 'string' ? entry.description : null,
      content: typeof entry.content === 'string' ? entry.content : null,
      url: entry.url,
      image: typeof entry.image === 'string' ? entry.image : null,
      publishedAt:
        typeof entry.publishedAt === 'string' ? entry.publishedAt : '',
      source: {
        name: typeof source.name === 'string' ? source.name : 'Unknown source',
        url: typeof source.url === 'string' ? source.url : null,
      },
    });
  }
  return results;
}

/**
 * Performs one search with a request timeout, retrying transient failures with
 * exponential backoff. 429 responses honour Retry-After when present.
 */
export async function searchNews(
  options: GNewsSearchOptions,
): Promise<GNewsArticle[]> {
  const apiKey = requireEnv('GNEWS_API_KEY');

  const url = new URL(ENDPOINT);
  url.searchParams.set('q', options.query);
  url.searchParams.set('lang', options.lang ?? 'en');
  url.searchParams.set('max', String(Math.min(Math.max(options.max, 1), 100)));
  url.searchParams.set('sortby', 'publishedAt');
  url.searchParams.set('expand', 'content');
  if (options.from) url.searchParams.set('from', options.from);
  url.searchParams.set('apikey', apiKey);

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const timeout = new AbortController();
    const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);

    // Abort if either the caller or the timeout fires.
    const onCallerAbort = () => timeout.abort();
    options.signal?.addEventListener('abort', onCallerAbort);

    try {
      const response = await fetch(url, {
        signal: timeout.signal,
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });

      if (response.ok) {
        return parseArticles(await response.json());
      }

      const retryable = response.status === 429 || response.status >= 500;
      const error = new GNewsError(
        safeMessage(response.status),
        response.status,
        retryable,
      );

      if (!retryable || attempt === MAX_ATTEMPTS) throw error;

      const retryAfter = Number(response.headers.get('retry-after'));
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter, 30) * 1000
          : BASE_BACKOFF_MS * 2 ** (attempt - 1);
      await sleep(waitMs);
      lastError = error;
    } catch (error) {
      if (error instanceof GNewsError && !error.retryable) throw error;
      if (options.signal?.aborted) throw error;
      if (attempt === MAX_ATTEMPTS) {
        lastError = error;
        break;
      }
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
      lastError = error;
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', onCallerAbort);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new GNewsError('GNews request failed.', 0, true);
}
