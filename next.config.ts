import type { NextConfig } from "next";

import { httpSecurityHeaders } from "./src/shared/security/http-security-headers";

const staticHttpSecurityHeaders = httpSecurityHeaders.filter(
  (header) => header.key !== "Content-Security-Policy",
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  headers() {
    return [
      {
        source: "/:path*",
        headers: staticHttpSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
