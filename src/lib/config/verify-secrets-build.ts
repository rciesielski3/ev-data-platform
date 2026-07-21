import { verifySecretsAtBuild } from './secrets';

export const runBuildVerification = (): void => {
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
