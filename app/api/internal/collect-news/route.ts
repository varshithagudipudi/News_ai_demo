import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/api/response';
import { rateLimit } from '@/lib/api/rateLimit';
import { getEnv } from '@/lib/config/env';
import { CollectionLockedError, collectNews } from '@/lib/news/collectNews';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export const runtime = 'nodejs';

const RATE_LIMIT = 4;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/** Constant-time comparison so the endpoint does not leak the secret by timing. */
function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Accepts either `Authorization: Bearer <secret>` (used by manual calls) or
 * Vercel Cron's own `Authorization: Bearer $CRON_SECRET` header — they are the
 * same scheme, so one check covers both.
 */
function isAuthorized(request: NextRequest, expected: string): boolean {
  const header = request.headers.get('authorization');
  if (!header) return false;

  const [scheme, ...rest] = header.split(' ');
  if (scheme.toLowerCase() !== 'bearer') return false;

  const token = rest.join(' ').trim();
  return token.length > 0 && secretMatches(token, expected);
}

async function handle(request: NextRequest) {
  const expected = getEnv().CRON_SECRET;

  if (!expected) {
    console.error('[collect-news] CRON_SECRET is not configured');
    return apiError(
      503,
      'NOT_CONFIGURED',
      'Collection is not configured on this deployment.',
    );
  }

  if (!isAuthorized(request, expected)) {
    // Never echo what was sent, and never say which part was wrong.
    console.warn('[collect-news] rejected unauthorized request');
    return apiError(401, 'UNAUTHORIZED', 'Missing or invalid authorization.');
  }

  const limit = rateLimit('collect-news', RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many collection requests. Try again shortly.',
        },
      },
      {
        status: 429,
        headers: { 'Retry-After': String(limit.retryAfterSeconds) },
      },
    );
  }

  try {
    const summary = await collectNews();
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    if (error instanceof CollectionLockedError) {
      return apiError(
        409,
        'RUN_IN_PROGRESS',
        'A collection run is already in progress.',
      );
    }

    console.error('[collect-news] run failed', {
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return apiError(
      500,
      'COLLECTION_FAILED',
      'The collection run could not be completed.',
    );
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

/** Vercel Cron issues GET requests, so the same handler serves both verbs. */
export async function GET(request: NextRequest) {
  return handle(request);
}
