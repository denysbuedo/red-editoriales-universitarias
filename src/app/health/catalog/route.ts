import { NextResponse } from "next/server";

import {
  buildOmekaCatalogOperationalDiagnostics,
  HttpOmekaApiClient,
  readOmekaCatalogRepositoryCacheSnapshot,
  readOmekaCatalogRepositoryOptions,
  readCatalogRepositoryMode,
  readOmekaConfig,
} from "@/modules/catalog/infrastructure";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = readCatalogRepositoryMode();
  const omekaConfig = readOmekaConfig();

  if (omekaConfig === null) {
    return NextResponse.json({
      status: "not-configured",
      catalogRepository: mode,
      omeka: null,
    });
  }

  const diagnostics = await buildOmekaCatalogOperationalDiagnostics(
    new HttpOmekaApiClient(omekaConfig),
  );
  const cache = readOmekaCatalogRepositoryCacheSnapshot(
    readOmekaCatalogRepositoryOptions(process.env, omekaConfig.baseUrl),
  );

  return NextResponse.json({
    status:
      diagnostics.installation.readyForPnpuMapping &&
      diagnostics.snapshot.quality.rejected === 0 &&
      diagnostics.snapshot.unknown.total === 0
        ? "ready"
        : "degraded",
    catalogRepository: mode,
    omeka: {
      baseUrl: omekaConfig.baseUrl,
      cache,
      ...diagnostics,
    },
  });
}
