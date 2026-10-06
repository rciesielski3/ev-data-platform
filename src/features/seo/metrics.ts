import { GscKeyword } from '@prisma/client';

export interface Trend {
  direction: 'up' | 'down' | 'flat';
  change: number;
}

export interface KeywordWithPrevious extends GscKeyword {
  previousPosition?: number;
}

export const calculateTrend = (oldValue: number, currentValue: number): Trend => {
  const change = oldValue - currentValue; // For position, lower is better
  if (change > 0) {
    return { direction: 'up', change };
  } else if (change < 0) {
    return { direction: 'down', change };
  }
  return { direction: 'flat', change: 0 };
};

export const findUnderperformers = (
  keywords: KeywordWithPrevious[],
  positionDropThreshold: number = 5
): KeywordWithPrevious[] => {
  return keywords.filter((kw) => {
    if (!kw.previousPosition) return false;
    const drop = kw.currentPosition - kw.previousPosition;
    return drop > positionDropThreshold;
  });
};

export const formatMetric = (value: number): string => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
};

export const calculateKeywordPreviousPosition = (snapshots: { date: Date; position: number }[]): number | undefined => {
  // Get snapshot from 7 days ago using UTC to ensure timezone consistency
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
  sevenDaysAgo.setUTCHours(0, 0, 0, 0);

  // Compare using UTC timestamps to avoid timezone mismatches
  const oldSnapshot = snapshots.find((s) => {
    const snapshotDate = new Date(s.date);
    snapshotDate.setUTCHours(0, 0, 0, 0);
    return snapshotDate.getTime() === sevenDaysAgo.getTime();
  });

  return oldSnapshot?.position;
};

export const calculateCtrPercentage = (ctr: number): string => {
  return (ctr * 100).toFixed(2) + '%';
};
