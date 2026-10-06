import { describe, it, expect } from 'vitest';
import {
  calculateTrend,
  findUnderperformers,
  formatMetric,
  calculateKeywordPreviousPosition,
  calculateCtrPercentage,
} from './metrics';

describe('SEO Metrics', () => {
  describe('calculateTrend', () => {
    it('should detect upward trend', () => {
      const old = 15;
      const current = 12;
      const trend = calculateTrend(old, current);
      expect(trend.direction).toBe('up'); // Lower position = better
      expect(trend.change).toBe(3);
    });

    it('should detect downward trend', () => {
      const old = 12;
      const current = 18;
      const trend = calculateTrend(old, current);
      expect(trend.direction).toBe('down');
      expect(trend.change).toBe(-6);
    });

    it('should detect flat trend', () => {
      const old = 15;
      const current = 15;
      const trend = calculateTrend(old, current);
      expect(trend.direction).toBe('flat');
      expect(trend.change).toBe(0);
    });
  });

  describe('findUnderperformers', () => {
    it('should identify keywords with position drop >5', () => {
      const keywords = [
        {
          id: 'k1',
          query: 'stacje ładowania',
          currentPosition: 18,
          currentClicks: 5,
          currentImpressions: 50,
          currentCtr: 0.1,
          siteUrl: 'https://evsource.pl',
          lastUpdated: new Date(),
          createdAt: new Date(),
          previousPosition: 12,
        },
        {
          id: 'k2',
          query: 'mapa ładowarek',
          currentPosition: 14,
          currentClicks: 3,
          currentImpressions: 40,
          currentCtr: 0.075,
          siteUrl: 'https://evsource.pl',
          lastUpdated: new Date(),
          createdAt: new Date(),
          previousPosition: 12,
        },
      ];
      const underperformers = findUnderperformers(keywords, 5);
      expect(underperformers).toHaveLength(1);
      expect(underperformers[0].query).toBe('stacje ładowania');
    });

    it('should return empty array if no underperformers', () => {
      const keywords = [
        {
          id: 'k1',
          query: 'stacje ładowania',
          currentPosition: 14,
          currentClicks: 5,
          currentImpressions: 50,
          currentCtr: 0.1,
          siteUrl: 'https://evsource.pl',
          lastUpdated: new Date(),
          createdAt: new Date(),
          previousPosition: 12,
        },
      ];
      const underperformers = findUnderperformers(keywords, 5);
      expect(underperformers).toHaveLength(0);
    });

    it('should exclude keywords without previous position', () => {
      const keywords = [
        {
          id: 'k1',
          query: 'stacje ładowania',
          currentPosition: 18,
          currentClicks: 5,
          currentImpressions: 50,
          currentCtr: 0.1,
          siteUrl: 'https://evsource.pl',
          lastUpdated: new Date(),
          createdAt: new Date(),
          previousPosition: undefined,
        },
      ];
      const underperformers = findUnderperformers(keywords, 5);
      expect(underperformers).toHaveLength(0);
    });
  });

  describe('formatMetric', () => {
    it('should format large numbers with K suffix', () => {
      expect(formatMetric(5000)).toBe('5.0K');
      expect(formatMetric(1500)).toBe('1.5K');
    });

    it('should format millions with M suffix', () => {
      expect(formatMetric(1234567)).toBe('1.2M');
      expect(formatMetric(5000000)).toBe('5.0M');
    });

    it('should return raw number for values less than 1000', () => {
      expect(formatMetric(42)).toBe('42');
      expect(formatMetric(999)).toBe('999');
      expect(formatMetric(0)).toBe('0');
    });
  });

  describe('calculateKeywordPreviousPosition', () => {
    it('should return position from 7 days ago', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const snapshots = [
        {
          id: 's1',
          keywordId: 'k1',
          date: sevenDaysAgo,
          position: 15,
          clicks: 5,
          impressions: 50,
          ctr: 0.1,
          createdAt: new Date(),
        },
        {
          id: 's2',
          keywordId: 'k1',
          date: today,
          position: 12,
          clicks: 8,
          impressions: 60,
          ctr: 0.133,
          createdAt: new Date(),
        },
      ];

      const result = calculateKeywordPreviousPosition(snapshots);
      expect(result).toBe(15);
    });

    it('should return undefined if no snapshot from 7 days ago', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const snapshots = [
        {
          id: 's1',
          keywordId: 'k1',
          date: today,
          position: 12,
          clicks: 8,
          impressions: 60,
          ctr: 0.133,
          createdAt: new Date(),
        },
      ];

      const result = calculateKeywordPreviousPosition(snapshots);
      expect(result).toBeUndefined();
    });
  });

  describe('calculateCtrPercentage', () => {
    it('should format CTR as percentage', () => {
      expect(calculateCtrPercentage(0.1)).toBe('10.00%');
      expect(calculateCtrPercentage(0.075)).toBe('7.50%');
      expect(calculateCtrPercentage(0.05)).toBe('5.00%');
    });

    it('should handle zero CTR', () => {
      expect(calculateCtrPercentage(0)).toBe('0.00%');
    });
  });
});
