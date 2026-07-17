import type { MetadataRoute } from "next";

import { getRuntimeConfig } from "@/shared/config/runtime-config";

export default function robots(): MetadataRoute.Robots {
  const runtimeConfig = getRuntimeConfig();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${runtimeConfig.publicBaseUrl}/sitemap.xml`,
  };
}
