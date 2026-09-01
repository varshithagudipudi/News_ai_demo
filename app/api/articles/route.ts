import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/api/response';
import { listArticles } from '@/lib/db/articles';
import { parseArticleQuery } from '@/lib/validation/article';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const parsed = parseArticleQuery(request.nextUrl.searchParams);

  if (!parsed.success) {
    return apiError(
      400,
      'INVALID_QUERY',
      'One or more query parameters are invalid.',
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const result = await listArticles(parsed.data);
    return NextResponse.json(result, {
      headers: {
        // Short shared cache: the feed only changes when a collection run does.
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('[api/articles] list failed', {
      message: error instanceof Error ? error.message : 'unknown error',
    });
    return apiError(
      500,
      'ARTICLES_UNAVAILABLE',
      'Articles could not be loaded right now. Please try again.',
    );
  }
}
