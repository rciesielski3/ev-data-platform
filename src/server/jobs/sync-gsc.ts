import { prisma } from '@/lib/db/prisma';
import { fetchGscData, GscClientError } from '@/lib/gsc/client';

export const syncGscData = async () => {
  const siteUrl = process.env.GOOGLE_GSC_SITE_URL;
  if (!siteUrl) {
    throw new Error('GOOGLE_GSC_SITE_URL not set');
  }

  // Fetch last 7 days of GSC data
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  let gscData;
  try {
    gscData = await fetchGscData(startDate, endDate);
  } catch (error) {
    if (error instanceof GscClientError) {
      console.error(`GSC API error (${error.status}): ${error.message}`);
      throw error;
    }
    throw error;
  }

  let keywordsUpserted = 0;
  let snapshotsCreated = 0;

  for (const row of gscData) {
    // Upsert keyword
    const keyword = await prisma.gscKeyword.upsert({
      where: { siteUrl_query: { siteUrl, query: row.query } },
      update: {
        currentPosition: row.position,
        currentClicks: row.clicks,
        currentImpressions: row.impressions,
        currentCtr: row.ctr,
      },
      create: {
        siteUrl,
        query: row.query,
        currentPosition: row.position,
        currentClicks: row.clicks,
        currentImpressions: row.impressions,
        currentCtr: row.ctr,
      },
    });

    keywordsUpserted += 1;

    // Create snapshot for today
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await prisma.gscSnapshot.upsert({
      where: { keywordId_date: { keywordId: keyword.id, date: today } },
      update: {
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
      },
      create: {
        keywordId: keyword.id,
        date: today,
        position: row.position,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
      },
    });

    snapshotsCreated += 1;
  }

  // Delete snapshots older than 7 days
  const cutoffDate = new Date();
  cutoffDate.setUTCHours(0, 0, 0, 0);
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 7);

  const deleteResult = await prisma.gscSnapshot.deleteMany({
    where: {
      date: {
        lt: cutoffDate,
      },
    },
  });

  const snapshotsDeleted = deleteResult.count;

  console.log(`[GSC Sync] Upserted ${keywordsUpserted} keywords, created ${snapshotsCreated} snapshots, deleted ${snapshotsDeleted} old snapshots`);

  return { keywordsUpserted, snapshotsCreated, snapshotsDeleted };
};
