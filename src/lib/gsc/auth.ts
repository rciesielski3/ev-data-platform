import { GscAuthConfig } from './types';

export const getGscClient = () => {
  const credentialsJson = process.env.GOOGLE_GSC_CREDENTIALS;
  if (!credentialsJson) {
    throw new Error('GOOGLE_GSC_CREDENTIALS env var not set');
  }

  let credentials: GscAuthConfig;
  try {
    credentials = JSON.parse(credentialsJson);
  } catch (e) {
    throw new Error('Invalid GOOGLE_GSC_CREDENTIALS JSON: ' + (e as Error).message);
  }

  // Return credentials for later use in client.ts
  // (Token refresh handled per-request in client.ts)
  return credentials;
};

export const validateGscConfig = (): boolean => {
  const required = ['GOOGLE_GSC_CREDENTIALS', 'GOOGLE_GSC_SITE_URL'];
  return required.every((key) => process.env[key]);
};
