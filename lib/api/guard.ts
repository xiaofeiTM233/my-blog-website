import { FeedError } from '@/lib/services/feeds';

let warned = false;

export function requireAdmin(request: Request) {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) {
    if (!warned) {
      warned = true;
      console.warn('[api] ADMIN_TOKEN 未配置，写接口处于无鉴权状态，上线前必须设置');
    }
    return;
  }
  if (request.headers.get('x-admin-token') !== secret) {
    throw new FeedError('需要管理员权限', 401);
  }
}
