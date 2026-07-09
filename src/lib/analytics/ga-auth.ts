import { OAuth2Client } from "google-auth-library";

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/google`
);

export const getAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/analytics.readonly",
      "profile",
      "email",
    ],
  });
};

export const exchangeCodeForToken = async (code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
};

export const refreshAccessToken = async (refreshToken: string) => {
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
};
