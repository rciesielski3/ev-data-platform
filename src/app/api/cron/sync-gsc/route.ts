import { NextRequest, NextResponse } from 'next/server';
import { syncGscData } from '@/server/jobs/sync-gsc';

export const dynamic = 'force-dynamic';

const isAuthorized = (request: NextRequest) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== 'production';
  }

  return request.headers.get('authorization') === `Bearer ${cronSecret}`;
};

const handleSync = async (req: NextRequest) => {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncGscData();
    return NextResponse.json(
      {
        success: true,
        keywordsUpserted: result.keywordsUpserted,
        snapshotsCreated: result.snapshotsCreated,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[cron/sync-gsc] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};

export const GET = handleSync;
export const POST = handleSync;
