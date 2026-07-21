import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runStartupChecks } from './startup-checks';

describe('Startup Checks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('runStartupChecks should complete without error when secrets are present', async () => {
    process.env.DATABASE_URL = 'postgresql://example';
    await expect(runStartupChecks()).resolves.not.toThrow();
  });

  it('runStartupChecks should throw when required secret is missing', async () => {
    delete process.env.DATABASE_URL;
    await expect(runStartupChecks()).rejects.toThrow('Application failed startup checks');
  });
});
