import { NextResponse } from 'next/server';
import { FeedError } from '@/lib/services/feeds';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: unknown) {
  if (error instanceof FeedError) {
    return NextResponse.json({ success: false, message: error.message }, { status: error.status });
  }
  console.error('[api] 未预期错误:', error);
  return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 });
}
