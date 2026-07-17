import { NextResponse } from "next/server";

import {
  createCatalogRepositoriesAsync,
  invalidateOmekaCatalogRepositoryCache,
  readOmekaCatalogRepositoryCacheSnapshot,
  readOmekaCatalogRepositoryOptions,
  readCatalogRepositoryMode,
  readOmekaConfig,
} from "@/modules/catalog/infrastructure";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const configuredToken = process.env.PNPU_CATALOG_REFRESH_TOKEN;

  if (configuredToken === undefined || configuredToken.trim().length === 0) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Catalog refresh endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  const token = request.headers.get("X-PNPU-Refresh-Token");

  if (token !== configuredToken) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: "Catalog refresh token is invalid.",
      },
      { status: 403 },
    );
  }

  const mode = readCatalogRepositoryMode();
  const omekaConfig = readOmekaConfig();

  if (mode !== "omeka" || omekaConfig === null) {
    return NextResponse.json(
      {
        code: "PNPU-409",
        message: "Catalog refresh requires the active Omeka repository.",
      },
      { status: 409 },
    );
  }

  const options = readOmekaCatalogRepositoryOptions(process.env, omekaConfig.baseUrl);
  const invalidated = invalidateOmekaCatalogRepositoryCache(options.cacheKey);
  await createCatalogRepositoriesAsync();

  return NextResponse.json({
    status: "refreshed",
    catalogRepository: mode,
    invalidated,
    omeka: {
      baseUrl: omekaConfig.baseUrl,
      cache: readOmekaCatalogRepositoryCacheSnapshot(options),
    },
  });
}
