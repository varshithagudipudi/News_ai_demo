import 'server-only';
import { getRepository } from '@/lib/db';
import type { ArticleListResponse, ArticleQuery } from '@/lib/types/article';

/** Data-access entry point used by GET /api/articles. */
export async function listArticles(
  query: ArticleQuery,
): Promise<ArticleListResponse> {
  const { items, total } = await getRepository().list(query);

  return {
    data: items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}
