import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/app/lib/mongobd';
import SiteVisit from '@/app/models/SiteVisit';
import { logger } from '@/utils/logger';

export const runtime = 'nodejs';

// Track last log time for this route only
let lastLogTime = 0;
const LOG_INTERVAL_MS = 60_000; // 1 min

function shouldLogForThisRoute() {
  const now = Date.now();

  // Always throttle this route, even in dev
  if (now - lastLogTime > LOG_INTERVAL_MS) {
    lastLogTime = now;
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const logNow = shouldLogForThisRoute();

  if (logNow) {
    logger.info('📥 Received GET /api/tracking/records');
  }

  try {
    await connectMongo();
    if (logNow) logger.info('✅ Connected to MongoDB');

    const { searchParams } = new URL(req.url);
    const rootDomain = searchParams.get('rootDomain');

    if (rootDomain) {
      if (logNow) logger.info('🔍 Fetching stats for domain', { rootDomain });

      const visits = await SiteVisit.find({ user: 'user1', rootDomain })
        .sort({ accessedAt: -1 })
        .lean();

      const totalTime = visits.reduce((sum, visit) => sum + (visit.timeOnSite || 0), 0);
      const lastVisit = visits[0]?.accessedAt || null;

      if (logNow) {
        logger.info('✅ Domain stats retrieved', { rootDomain, totalTime, lastVisit });
      }

      return NextResponse.json({ rootDomain, totalTime, lastVisit });
    } else {
      if (logNow) logger.info('📅 Fetching all visits for calendar view');

      const visits = await SiteVisit.find({ user: 'user1' })
        .sort({ accessedAt: -1 })
        .lean();

      if (logNow) logger.info(`✅ Retrieved ${visits.length} visits`);

      return NextResponse.json({ visits });
    }
  } catch (err: any) {
    // Error logs are never throttled — important for debugging
    logger.error('❌ Failed to fetch site visits', err);
    return NextResponse.json({ error: 'Failed to fetch site visits' }, { status: 500 });
  }
}
