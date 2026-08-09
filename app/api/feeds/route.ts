// app/api/feeds/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Feed, { type IFeed } from '@/lib/models/Feed';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)));
    const channel = searchParams.get('channel') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const keyword = searchParams.get('keyword') || undefined;

    const query: Record<string, unknown> = {};
    if (channel) query['meta.channel'] = channel;
    if (type) query['meta.type'] = type;
    if (status) query['meta.status'] = status;
    if (priority) query['meta.priority'] = priority;
    if (tag) query['content.tags'] = tag;
    if (keyword) {
      query.$or = [
        { 'content.title': { $regex: keyword, $options: 'i' } },
        { 'content.body': { $regex: keyword, $options: 'i' } },
      ];
    }

    const total = await Feed.countDocuments(query);
    const feeds = await Feed.find(query)
      .sort({ 'meta.timestamp': -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        list: feeds,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body: IFeed = await request.json();
    if (!body.meta?.timestamp) {
      body.meta = { ...body.meta, timestamp: Math.floor(Date.now() / 1000) };
    }
    const feed = await Feed.create(body);
    return NextResponse.json({ success: true, data: feed }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 },
    );
  }
}
