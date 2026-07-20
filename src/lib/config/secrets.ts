export const REQUIRED_SECRETS = {
  DATABASE_URL: {
    description: 'Neon PostgreSQL connection string (pooled)',
    required: true,
    env: 'DATABASE_URL',
  },
  NEXTAUTH_SECRET: {
    description: 'NextAuth session encryption key',
    required: process.env.NODE_ENV === 'production',
    env: 'NEXTAUTH_SECRET',
  },
  NEXTAUTH_URL: {
    description: 'NextAuth callback URL',
    required: process.env.NODE_ENV === 'production',
    env: 'NEXTAUTH_URL',
  },
  NEON_API_KEY: {
    description: 'Neon API key for backup/management operations',
    required: process.env.NODE_ENV === 'production',
    env: 'NEON_API_KEY',
  },
} as const;

export const verifySecretsAtBuild = (): void => {
  const missing: string[] = [];

  Object.entries(REQUIRED_SECRETS).forEach(([key, config]) => {
    // Determine if this secret is required based on current NODE_ENV
    // DATABASE_URL is always required; others are required only in production
    const isRequired = key === 'DATABASE_URL'
      ? true
      : process.env.NODE_ENV === 'production';

    if (isRequired && !process.env[config.env]) {
      missing.push(`${key} is required${process.env.NODE_ENV === 'production' ? ' in production' : ''}`);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(', ')}`);
  }
};

export const verifySecretsAtRuntime = (): void => {
  verifySecretsAtBuild();
};
