export const runStartupChecks = async (): Promise<void> => {
  // Skip verification in CI environments - secrets will be verified in production
  if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.VERCEL) {
    console.log('[Startup] ℹ Skipping secrets verification in CI environment');
    return;
  }

  try {
    const { verifySecretsAtRuntime } = await import('./secrets');
    verifySecretsAtRuntime();
    console.log('[Startup] ✓ All required secrets verified');
  } catch (error) {
    console.error('[Startup] ✗ Startup checks failed:', error instanceof Error ? error.message : String(error));
    throw new Error('Application failed startup checks. Cannot proceed.');
  }
};
