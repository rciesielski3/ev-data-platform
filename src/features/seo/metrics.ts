import { GscKeyword, GscSnapshot } from '@prisma/client';

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

export const calculateKeywordPreviousPosition = (snapshots: GscSnapshot[]): number | undefined => {
  // Get snapshot from 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const oldSnapshot = snapshots.find((s) => s.date.getTime() === sevenDaysAgo.getTime());
  return oldSnapshot?.position;
};

export const calculateCtrPercentage = (ctr: number): string => {
  return (ctr * 100).toFixed(2) + '%';
};
