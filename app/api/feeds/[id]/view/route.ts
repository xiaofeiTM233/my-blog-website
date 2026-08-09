import type { NextRequest } from 'next/server';
import { fail, ok } from '@/lib/api/respond';
import { recordView } from '@/lib/services/feeds';

export async function POST(request: NextRequest, context: RouteContext<'/api/feeds/[id]/view'>) {
  try {
    const { id } = await context.params;
    const viewer = request.nextUrl.searchParams.get('viewer');
    await recordView(id, viewer ?? 'anonymous');
    return ok({ recorded: true });
  } catch (error) {
    return fail(error);
  }
}
