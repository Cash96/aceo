import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/app/lib/mongobd';
import SiteVisit from '@/app/models/SiteVisit';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await connectMongo();

    const { searchParams } = new URL(req.url);
    const rootDomain = searchParams.get('rootDomain');

    if (!rootDomain) {
      return NextResponse.json({ error: 'Missing rootDomain' }, { status: 400 });
    }

    const visits = await SiteVisit.find({
      user: 'user1',
      rootDomain
    }).sort({ accessedAt: -1 }).lean();

    const totalTime = visits.reduce((sum, visit) => sum + (visit.timeOnSite || 0), 0);
    const lastVisit = visits[0]?.accessedAt || null;

    return NextResponse.json({
      rootDomain,
      totalTime,
      lastVisit
    });
  } catch (err: any) {
    console.error('❌ Failed to fetch site visits:', err);
    return NextResponse.json(
      { error: 'Failed to fetch site visits' },
      { status: 500 }
    );
  }
}
