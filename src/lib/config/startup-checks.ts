export const runStartupChecks = async (): Promise<void> => {
  try {
    const { verifySecretsAtRuntime } = await import('./secrets');
    verifySecretsAtRuntime();
    console.log('[Startup] ✓ All required secrets verified');
  } catch (error) {
    console.error('[Startup] ✗ Startup checks failed:', error instanceof Error ? error.message : String(error));
    throw new Error('Application failed startup checks. Cannot proceed.');
  }
};
