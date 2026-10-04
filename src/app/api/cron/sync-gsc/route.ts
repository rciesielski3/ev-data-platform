import { NextRequest, NextResponse } from 'next/server';
import { syncGscData } from '@/server/jobs/sync-gsc';

export const dynamic = 'force-dynamic';

export const POST = async (req: NextRequest) => {
  // Verify Vercel cron signature (optional but recommended)
  const authHeader = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && !authHeader?.startsWith('Bearer ')) {
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
