import type { NextRequest } from 'next/server';
import { CURRENT_ACTOR_ID } from '@/lib/api/actor';
import { fail, ok } from '@/lib/api/respond';
import { FeedError, setLiked } from '@/lib/services/feeds';

export async function POST(request: NextRequest, context: RouteContext<'/api/feeds/[id]/likes'>) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { liked?: unknown };
    if (typeof body.liked !== 'boolean') throw new FeedError('liked 必须是布尔值', 422);
    return ok(await setLiked(id, CURRENT_ACTOR_ID, body.liked));
  } catch (error) {
    return fail(error);
  }
}
