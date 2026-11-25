import { runBuildVerification } from './src/lib/config/verify-secrets-build';

// Verify secrets before build
runBuildVerification();

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ev-data-platform.vercel.app" }],
        destination: "https://evsource.pl/:path*",
        permanent: true,
      },
    ];
  },
  outputFileTracingIncludes: {
    "/operators/[slug]/opengraph-image": ["./src/lib/og/inter-600.woff"],
    "/stations/[id]/opengraph-image": ["./src/lib/og/inter-600.woff"],
  },
};

export default withNextIntl(nextConfig);
