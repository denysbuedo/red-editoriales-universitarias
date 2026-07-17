import type { NextConfig } from "next";

import { httpSecurityHeaders } from "./src/shared/security/http-security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  headers() {
    return [
      {
        source: "/:path*",
        headers: httpSecurityHeaders,
      },
    ];
  },
};

export default nextConfig;
