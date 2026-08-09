import type { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api/respond';
import { addComment } from '@/lib/services/feeds';

export async function POST(
  request: NextRequest,
  context: RouteContext<'/api/feeds/[id]/comments'>,
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { viewer?: unknown; body?: unknown };
    return ok(
      await addComment(
        id,
        typeof body.viewer === 'string' ? body.viewer : '',
        typeof body.body === 'string' ? body.body : '',
      ),
    );
  } catch (error) {
    return fail(error);
  }
}
