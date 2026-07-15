import { describe, it, expect } from 'vitest';
import {
  CACHE_STRATEGIES,
  getCacheHeaders,
  setResponseHeaders,
  addEtagHeader,
} from './headers';
import { NextResponse } from 'next/server';

describe('Cache Headers', () => {
  describe('getCacheHeaders', () => {
    it('STATIC strategy returns 3600s max-age', () => {
      const headers = getCacheHeaders('STATIC');
      expect(headers['Cache-Control']).toContain('max-age=3600');
    });

    it('DYNAMIC strategy returns 300s max-age', () => {
      const headers = getCacheHeaders('DYNAMIC');
      expect(headers['Cache-Control']).toContain('max-age=300');
    });

    it('MAP strategy returns 600s max-age', () => {
      const headers = getCacheHeaders('MAP');
      expect(headers['Cache-Control']).toContain('max-age=600');
    });

    it('all strategies include stale-while-revalidate', () => {
      const strategies = ['STATIC', 'DYNAMIC', 'MAP'] as const;

      strategies.forEach((strategy) => {
        const headers = getCacheHeaders(strategy);
        expect(headers['Cache-Control']).toContain('stale-while-revalidate=');
        expect(headers['CDN-Cache-Control']).toContain('stale-while-revalidate=');
      });
    });

    it('all strategies include Vary: Accept-Encoding header', () => {
      const strategies = ['STATIC', 'DYNAMIC', 'MAP'] as const;

      strategies.forEach((strategy) => {
        const headers = getCacheHeaders(strategy);
        expect(headers).toHaveProperty('Vary', 'Accept-Encoding');
      });
    });
  });

  describe('setResponseHeaders', () => {
    it('sets cache headers on response object', () => {
      const response = new NextResponse('test');
      const result = setResponseHeaders(response, 'STATIC');

      expect(result.headers.get('Cache-Control')).toContain('max-age=3600');
      expect(result.headers.get('CDN-Cache-Control')).toBeDefined();
    });

    it('returns the modified response', () => {
      const response = new NextResponse('test');
      const result = setResponseHeaders(response, 'DYNAMIC');

      expect(result).toBeInstanceOf(NextResponse);
    });
  });

  describe('addEtagHeader', () => {
    it('generates consistent ETag for same data', () => {
      const response1 = new NextResponse('test');
      const response2 = new NextResponse('test');
      const data = { id: 1, name: 'test' };

      addEtagHeader(response1, data);
      addEtagHeader(response2, data);

      expect(response1.headers.get('ETag')).toBe(response2.headers.get('ETag'));
    });

    it('generates different ETag for different data', () => {
      const response1 = new NextResponse('test');
      const response2 = new NextResponse('test');

      addEtagHeader(response1, { id: 1 });
      addEtagHeader(response2, { id: 2 });

      expect(response1.headers.get('ETag')).not.toBe(response2.headers.get('ETag'));
    });

    it('returns the modified response', () => {
      const response = new NextResponse('test');
      const result = addEtagHeader(response, { data: 'test' });

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.headers.get('ETag')).toBeDefined();
    });

    it('handles undefined data gracefully without throwing', () => {
      const response = new NextResponse('test');
      const result = addEtagHeader(response, undefined);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.headers.get('ETag')).toBeNull();
    });

    it('handles non-serializable data gracefully without throwing', () => {
      const response = new NextResponse('test');
      const circularRef = { a: 1 };
      (circularRef as Record<string, unknown>).self = circularRef;

      const result = addEtagHeader(response, circularRef);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result.headers.get('ETag')).toBeNull();
    });
  });

  describe('CACHE_STRATEGIES constants', () => {
    it('defines all required strategies with correct values', () => {
      expect(CACHE_STRATEGIES.STATIC.maxAge).toBe(3600);
      expect(CACHE_STRATEGIES.DYNAMIC.maxAge).toBe(300);
      expect(CACHE_STRATEGIES.MAP.maxAge).toBe(600);
    });

    it('all strategies have stale-while-revalidate configured', () => {
      Object.values(CACHE_STRATEGIES).forEach((config) => {
        expect(config.staleWhileRevalidate).toBeGreaterThan(0);
      });
    });
  });
});
