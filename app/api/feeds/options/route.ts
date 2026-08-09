import { fail, ok } from '@/lib/api/respond';
import { getFeedOptions } from '@/lib/services/feeds';

export async function GET() {
  try {
    return ok(await getFeedOptions());
  } catch (error) {
    return fail(error);
  }
}
