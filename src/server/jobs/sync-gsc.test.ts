import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncGscData } from './sync-gsc';
import type { GscQuery } from '../../lib/gsc/types';

vi.mock('../../lib/gsc/client', () => ({
  fetchGscData: vi.fn(),
  GscClientError: Error,
}));

vi.mock('../../lib/db/prisma', () => ({
  prisma: {
    gscKeyword: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    gscSnapshot: {
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    gscMetrics: {
      upsert: vi.fn(),
    },
  },
}));

describe('syncGscData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GSC_SITE_URL = 'https://evsource.pl';
  });

  it('should upsert keywords and create snapshots', async () => {
    const mockData: GscQuery[] = [
      { query: 'stacje ładowania', clicks: 5, impressions: 50, ctr: 0.1, position: 12 },
    ];

    const { fetchGscData } = await import('../../lib/gsc/client');
    const { prisma } = await import('../../lib/db/prisma');

    vi.mocked(fetchGscData).mockResolvedValueOnce(mockData);
    vi.mocked(prisma.gscKeyword.upsert).mockResolvedValueOnce({
      id: 'keyword-1',
      siteUrl: 'https://evsource.pl',
      query: 'stacje ładowania',
      currentPosition: 12,
      currentClicks: 5,
      currentImpressions: 50,
      currentCtr: 0.1,
      createdAt: new Date(),
      lastUpdated: new Date(),
    });
    vi.mocked(prisma.gscKeyword.findMany).mockResolvedValueOnce([
      {
        id: 'keyword-1',
        siteUrl: 'https://evsource.pl',
        query: 'stacje ładowania',
        currentPosition: 12,
        currentClicks: 5,
        currentImpressions: 50,
        currentCtr: 0.1,
        createdAt: new Date(),
        lastUpdated: new Date(),
      },
    ]);
    vi.mocked(prisma.gscSnapshot.upsert).mockResolvedValueOnce({
      id: 'snapshot-1',
      keywordId: 'keyword-1',
      date: new Date(),
      position: 12,
      clicks: 5,
      impressions: 50,
      ctr: 0.1,
      createdAt: new Date(),
    });
    vi.mocked(prisma.gscSnapshot.deleteMany).mockResolvedValueOnce({ count: 0 });
    vi.mocked(prisma.gscMetrics.upsert).mockResolvedValueOnce({
      id: 'metrics-1',
      siteUrl: 'https://evsource.pl',
      totalKeywords: 1,
      avgImpressions: 50,
      avgClicks: 5,
      avgCtr: 0.1,
      lastCalculated: new Date(),
    });

    const result = await syncGscData();

    expect(result.keywordsUpserted).toBe(1);
    expect(result.snapshotsCreated).toBe(1);
    expect(result.snapshotsDeleted).toBe(0);
    expect(result.metricsUpdated).toBe(1);
  });

  it('should handle empty GSC response', async () => {
    const { fetchGscData } = await import('../../lib/gsc/client');
    const { prisma } = await import('../../lib/db/prisma');

    vi.mocked(fetchGscData).mockResolvedValueOnce([]);
    vi.mocked(prisma.gscKeyword.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.gscSnapshot.deleteMany).mockResolvedValueOnce({ count: 0 });

    const result = await syncGscData();

    expect(result.keywordsUpserted).toBe(0);
    expect(result.snapshotsCreated).toBe(0);
    expect(result.snapshotsDeleted).toBe(0);
    expect(result.metricsUpdated).toBe(0);
  });
});
