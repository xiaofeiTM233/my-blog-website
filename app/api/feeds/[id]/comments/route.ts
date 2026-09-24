import type { NextRequest } from 'next/server';
import { CURRENT_ACTOR_ID } from '@/lib/api/actor';
import { fail, ok } from '@/lib/api/respond';
import { addComment } from '@/lib/services/feeds';

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/feeds/[id]/comments'>,
) {
  try {
    const { id } = await context.params;
    const payload = (await request.json()) as { body?: unknown };
    return ok(
      await addComment(id, CURRENT_ACTOR_ID, typeof payload.body === 'string' ? payload.body : ''),
    );
  } catch (error) {
    return fail(error);
  }
}
