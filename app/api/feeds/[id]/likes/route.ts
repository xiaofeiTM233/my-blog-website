import type { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api/respond';
import { FeedError, setLiked } from '@/lib/services/feeds';

export async function POST(request: NextRequest, context: RouteContext<'/api/feeds/[id]/likes'>) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { viewer?: unknown; liked?: unknown };
    if (typeof body.liked !== 'boolean') throw new FeedError('liked 必须是布尔值', 422);
    if (typeof body.viewer !== 'string') throw new FeedError('viewer 必填', 422);
    return ok(await setLiked(id, body.viewer, body.liked));
  } catch (error) {
    return fail(error);
  }
}
