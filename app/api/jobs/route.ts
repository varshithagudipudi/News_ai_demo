import { NextResponse } from 'next/server';
import { getLiveJobs } from '@/lib/jobs/live';
export const dynamic = 'force-dynamic';
export async function GET() {
  const result = await getLiveJobs();
  return NextResponse.json(result, { status: result.sources.some((source) => source.status === 'ok') ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}
