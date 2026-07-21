import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifySecretsAtBuild, verifySecretsAtRuntime } from './secrets';
import { runStartupChecks } from './startup-checks';

describe('Secrets Verification Integration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DATABASE_URL = 'postgresql://example';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'development';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should verify secrets successfully in development', () => {
    expect(() => verifySecretsAtBuild()).not.toThrow();
    expect(() => verifySecretsAtRuntime()).not.toThrow();
  });

  it('should require DATABASE_URL in all environments', () => {
    delete process.env.DATABASE_URL;
    expect(() => verifySecretsAtBuild()).toThrow('DATABASE_URL is required');
  });

  it('should require additional secrets in production', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'production';
    delete process.env.NEON_API_KEY;
    expect(() => verifySecretsAtBuild()).toThrow('NEON_API_KEY is required in production');
  });

  it('should pass all checks when all production secrets are set', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'production';
    process.env.NEON_API_KEY = 'test-key';
    expect(() => verifySecretsAtBuild()).not.toThrow();
  });

  it('should integrate startup checks with secrets verification', async () => {
    process.env.DATABASE_URL = 'postgresql://example';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process.env as any).NODE_ENV = 'development';
    await expect(runStartupChecks()).resolves.not.toThrow();
  });

  it('should fail startup checks when secrets are missing', async () => {
    delete process.env.DATABASE_URL;
    await expect(runStartupChecks()).rejects.toThrow('Application failed startup checks');
  });
});
