import { NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/lib/types/article';

/** Every API failure uses this shape so the client can handle one contract. */
export function apiError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: { code, message, details } }, { status });
}
