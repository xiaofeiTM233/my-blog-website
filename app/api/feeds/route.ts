import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/guard';
import { fail, ok } from '@/lib/api/respond';
import { createFeed, listFeeds } from '@/lib/services/feeds';

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    return ok(
      await listFeeds({
        page: sp.get('page'),
        pageSize: sp.get('pageSize'),
        channel: sp.get('channel'),
        type: sp.get('type'),
        status: sp.get('status'),
        priority: sp.get('priority'),
        tag: sp.get('tag'),
        keyword: sp.get('keyword'),
        viewer: sp.get('viewer'),
      }),
    );
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    return ok(await createFeed(await request.json()), 201);
  } catch (error) {
    return fail(error);
  }
}
