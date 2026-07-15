import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export const CACHE_STRATEGIES = {
  STATIC: {
    maxAge: 3600, // 1 hour
    sMaxAge: 31536000, // 1 year (CDN)
    staleWhileRevalidate: 86400, // 1 day
  },
  DYNAMIC: {
    maxAge: 300, // 5 minutes
    sMaxAge: 600, // 10 minutes (CDN)
    staleWhileRevalidate: 3600, // 1 hour
  },
  MAP: {
    maxAge: 600, // 10 minutes
    sMaxAge: 1800, // 30 minutes (CDN)
    staleWhileRevalidate: 7200, // 2 hours
  },
} as const;

export type CacheStrategy = keyof typeof CACHE_STRATEGIES;

export const getCacheHeaders = (strategy: CacheStrategy): Record<string, string> => {
  const config = CACHE_STRATEGIES[strategy];

  return {
    'Cache-Control': `public, max-age=${config.maxAge}, s-maxage=${config.sMaxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`,
    'CDN-Cache-Control': `max-age=${config.sMaxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`,
  };
};

export const setResponseHeaders = (
  response: NextResponse,
  strategy: CacheStrategy,
): NextResponse => {
  const headers = getCacheHeaders(strategy);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
};

export const addEtagHeader = (response: NextResponse, data: unknown): NextResponse => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(data));
  const etag = `"${hash.digest('hex').slice(0, 16)}"`;

  response.headers.set('ETag', etag);
  return response;
};
