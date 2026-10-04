import { sign } from 'jsonwebtoken';
import { GscQuery, GscAuthConfig, GscApiResponse } from './types';
import { getGscClient } from './auth';

const GSC_API_URL = 'https://www.googleapis.com/webmasters/v3/sites';
const TOKEN_CACHE: { token: string; expiresAt: number } = { token: '', expiresAt: 0 };

export class GscClientError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GscClientError';
  }
}

// For testing purposes only
export const resetTokenCache = () => {
  TOKEN_CACHE.token = '';
  TOKEN_CACHE.expiresAt = 0;
};

interface JwtHeader {
  alg: string;
  typ: string;
}

interface JwtPayload {
  iss: string;
  sub: string;
  scope: string;
  aud: string;
  iat: number;
  exp: number;
}

const signJwt = (header: JwtHeader, payload: JwtPayload, privateKey: string): string => {
  return sign(payload, privateKey, { algorithm: 'RS256', header });
};

const getAccessToken = async (): Promise<string> => {
  const now = Date.now();
  if (TOKEN_CACHE.token && TOKEN_CACHE.expiresAt > now + 60000) {
    return TOKEN_CACHE.token;
  }

  const credentials: GscAuthConfig = getGscClient();
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: credentials.token_uri,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + 3600,
  };

  let token: string;
  try {
    token = signJwt(header, payload, credentials.private_key);
  } catch (e) {
    throw new GscClientError(`Failed to sign JWT: ${(e as Error).message}`);
  }

  const response = await fetch(credentials.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: token,
    }).toString(),
  });

  if (!response.ok) {
    throw new GscClientError(`Failed to get access token: ${response.statusText}`, response.status);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  TOKEN_CACHE.token = data.access_token;
  TOKEN_CACHE.expiresAt = Date.now() + data.expires_in * 1000;

  return data.access_token;
};

export const fetchGscData = async (startDate: Date, endDate: Date): Promise<GscQuery[]> => {
  const siteUrl = process.env.GOOGLE_GSC_SITE_URL;
  if (!siteUrl) {
    throw new GscClientError('GOOGLE_GSC_SITE_URL not set');
  }

  const token = await getAccessToken();
  const encodedSite = encodeURIComponent(siteUrl);
  const url = `${GSC_API_URL}/${encodedSite}/searchAnalytics/query`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: 10000,
    }),
  });

  if (!response.ok) {
    throw new GscClientError(`GSC API error: ${response.statusText}`, response.status);
  }

  const data = (await response.json()) as GscApiResponse;
  return data.rows || [];
};
