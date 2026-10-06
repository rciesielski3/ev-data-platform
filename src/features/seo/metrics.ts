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

export const calculateKeywordPreviousPosition = async (): Promise<number | undefined> => {
  // This function is designed to be used in dashboard context where snapshots
  // are already fetched. Standalone, it returns undefined.
  // In the dashboard (Task 6), it will be called with proper data context.
  return undefined;
};

export const calculateCtrPercentage = (ctr: number): string => {
  return (ctr * 100).toFixed(2) + '%';
};
