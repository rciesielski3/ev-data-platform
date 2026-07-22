import { verifySecretsAtBuild } from './secrets';

export const runBuildVerification = (): void => {
  // Skip verification in CI environments (GitHub Actions, Vercel, etc.)
  // Production secrets will be verified at runtime instead
  if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.VERCEL) {
    console.log('ℹ Skipping build-time secrets verification in CI environment');
    return;
  }

  try {
    verifySecretsAtBuild();
    console.log('✓ All required secrets verified at build time');
  } catch (error) {
    console.error(
      '✗ Build verification failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
};

runBuildVerification();
