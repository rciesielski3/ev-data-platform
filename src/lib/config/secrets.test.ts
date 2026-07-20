import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifySecretsAtBuild, verifySecretsAtRuntime, REQUIRED_SECRETS } from './secrets';

describe('Secrets Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('verifySecretsAtBuild should throw if DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    expect(() => verifySecretsAtBuild()).toThrow('DATABASE_URL is required');
  });

  it('verifySecretsAtBuild should throw if NEXTAUTH_SECRET is missing in production', () => {
    process.env.DATABASE_URL = 'postgresql://...';
    delete process.env.NEXTAUTH_SECRET;
    (process.env as Record<string, string>).NODE_ENV = 'production';
    expect(() => verifySecretsAtBuild()).toThrow('NEXTAUTH_SECRET is required in production');
  });

  it('verifySecretsAtRuntime should validate all required secrets', () => {
    process.env.DATABASE_URL = 'postgresql://...';
    expect(() => verifySecretsAtRuntime()).not.toThrow();
  });

  it('should define all required secrets with metadata', () => {
    expect(REQUIRED_SECRETS).toBeDefined();
    expect(Object.keys(REQUIRED_SECRETS).length).toBeGreaterThan(0);
    Object.values(REQUIRED_SECRETS).forEach((secret) => {
      expect(secret.description).toBeDefined();
      expect(secret.required).toBeDefined();
    });
  });
});
