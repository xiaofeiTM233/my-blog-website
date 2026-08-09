import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/api/guard';
import { fail, ok } from '@/lib/api/respond';
import { FeedError, getFeed, removeFeed, restoreFeed, updateFeed } from '@/lib/services/feeds';

export async function GET(request: NextRequest, context: RouteContext<'/api/feeds/[id]'>) {
  try {
    const { id } = await context.params;
    return ok(await getFeed(id, request.nextUrl.searchParams.get('viewer')));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext<'/api/feeds/[id]'>) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    return ok(await updateFeed(id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext<'/api/feeds/[id]'>) {
  try {
    requireAdmin(request);
    const { id } = await context.params;
    const params = request.nextUrl.searchParams;

    if (params.get('restore') === '1') {
      const doc = await restoreFeed(id);
      if (!doc) throw new FeedError('动态不存在或未处于删除状态', 404);
      return ok(doc);
    }

    await removeFeed(id, params.get('hard') === '1');
    return ok({ id, deleted: true });
  } catch (error) {
    return fail(error);
  }
}
