import type { NextRequest } from 'next/server';
import { CURRENT_ACTOR_ID } from '@/lib/api/actor';
import { fail, ok } from '@/lib/api/respond';
import { recordView } from '@/lib/services/feeds';

export async function POST(_request: NextRequest, context: RouteContext<'/api/feeds/[id]/view'>) {
  try {
    const { id } = await context.params;
    await recordView(id, CURRENT_ACTOR_ID);
    return ok({ recorded: true });
  } catch (error) {
    return fail(error);
  }
}
