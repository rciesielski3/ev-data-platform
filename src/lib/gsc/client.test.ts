import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchGscData, resetTokenCache } from './client';

// Mock fetch globally
global.fetch = vi.fn() as unknown as typeof fetch;

// Test RSA private key (generated for testing only)
const TEST_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCoypiwk4Lun8n2
vUnb5kZPfRE//oc2f6Ixmm6V4dAnGsGUKNWlwgx3G7hNbFWfP8Z9wNoIeuUmA03v
Ckjoeb4Mgz06yDRO4yNglYqgL7EbaxgUbx7cuuZqRZLAyORtsFbJUjILPTvx50rt
N9TT0KfGKLkQlb/073TKdCB6oAuDHYgyZbT+3tFfijOVodjmNpEgqGFbuSVk2MIA
MfAEB45fxUaHAv6nXSOJxVuggT1TPoZck4qQiVM6P5E88iLAEpwTlhg8sneq5tqj
i/FBin51QTTplCA1kPjIyai8VKn7nDc5JIvmfLHdeLmvfE4boJ4xEluUITL2qCT8
/9hbAP6hAgMBAAECggEAAfta/pvEykt7Ahgn4VqbUbycsr0o1kV6YI25Ja5glMz2
H+i41XjpT462Q8Z1XOjRSlG03aufvCoGxLtAruYbCqeR1Ppbzt9Q34Xx+j6FHFbO
EhNZ7+qL4QyPFA9nyzfqVPPPnZ0q8oSuNwnUSGZnSebZgW3YsqYLH4NsjDQL3o65
0yIp/xMBtU2P1VibueBqhB79ANrrk55iqi07YVT4bVowQg9voF4RsttRjzeH7GPx
DLvFz0GUHvQsItJOXWxExHTtYx6xPNQi6W9ARAmMlB5pv5dqW8jrV0jcs5Z64voL
0Fr8pnutGuY4bl1vTjNpnS+PGXPFOKHQb/iUhSy1IQKBgQDZ0AO60T6SVZZDdPyE
wj3wCD8ifCl0gCD7o6e92gknCIcK3brd9Wcwjk6feXRJvnU0tBftVwZxPjJLfepx
udkij+uox4ZvfoYTLvg/VkH57wSsMDGY859jQKp8DfZIsxMGVFqarscchI0542K4
Ruf/8Vn+p8fJ6tN1SnyYvqvsaQKBgQDGYmLunxHuGACI3CHlB3q+hoclTwkkp4RH
68tiDJnY2EksxikgQvIZ7lErbGKSIY50MvA0lgjUKtzWTJsstNbFSou2zXkYd8XV
vLcPJBFA7wjYkRNdxZgM5bRjQgUQH3jK9X1BvKySU/za7JTJrzjDT3cP5zxovvgY
EKgDT2gZeQKBgQDPpjcYEEnV2lBhyRLAQiooPsRpzPL8hPZs0E2nekkFdGTB4Dc5
Sa5xpQmhkXlioHc+on65HyEeLsxmGgm7GBHAmHJzOpyYiIernDjAsSw+6TaMLXnr
Nj76sXiWwfzMvCPkAeFK3FsofdnhmTzRL5AX+fDxDOU0Q3IKvNNiD0z6GQKBgCXK
MBZMbtnv8IohhMNf/V21uqC8wX0d+/DHVeLDi7rm2GmTBdqDZiLSZtvitZQomD5C
Rcd+nQftckvQI+8MM605WgvkcCDdD+57GFPmBvNblU/Lsui17xTl3MrblKNRm2zt
/oI7MpRdM1lwn5cbrbBmvsNkxPkfB5tt8NNQmP/hAoGAB35zW8M4B+t7IOrfWKn9
TlVToLERhEvL3+j3DpVwz0Xs3JWwxdzcqbWItzVWcYd0V5IKQkAZOprkWKld7YQL
iHj0By2ibE/m8VDAt3GCy78yDKPlN5TgSeSVsc4s9uqZoFO47rblAXteu5m32wx6
nSt2Coy/9HrJ9HaRRMs7M4Y=
-----END PRIVATE KEY-----`;

describe('GSC Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTokenCache();
    process.env.GOOGLE_GSC_CREDENTIALS = JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'key-id',
      private_key: TEST_PRIVATE_KEY,
      client_email: 'test@test.iam.gserviceaccount.com',
      client_id: '123456789',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40test.iam.gserviceaccount.com',
    });
    process.env.GOOGLE_GSC_SITE_URL = 'https://evsource.pl';
  });

  it('should fetch GSC data for date range', async () => {
    const mockTokenResponse = {
      access_token: 'mock-token-123',
      expires_in: 3600,
    };
    const mockGscResponse = {
      rows: [
        { query: 'stacje ładowania', clicks: 5, impressions: 50, ctr: 0.1, position: 12 },
        { query: 'mapa ładowarek', clicks: 3, impressions: 40, ctr: 0.075, position: 15 },
      ],
    };

    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGscResponse,
      });

    const startDate = new Date('2026-09-20');
    const endDate = new Date('2026-09-27');
    const data = await fetchGscData(startDate, endDate);

    expect(data).toHaveLength(2);
    expect(data[0].query).toBe('stacje ładowania');
    expect(data[0].clicks).toBe(5);
  });

  it('should throw on API error', async () => {
    const mockTokenResponse = {
      access_token: 'mock-token-123',
      expires_in: 3600,
    };

    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTokenResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error: 'Unauthorized' }),
      });

    const startDate = new Date('2026-09-20');
    const endDate = new Date('2026-09-27');

    await expect(fetchGscData(startDate, endDate)).rejects.toThrow('GSC API error');
  });
});
