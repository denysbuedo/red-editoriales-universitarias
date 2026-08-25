import { NextResponse } from "next/server";

import {
  buildOmekaCatalogOperationalDiagnostics,
  createOmekaCatalogRepositoriesFromApi,
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

  const client = new HttpOmekaApiClient(omekaConfig);
  const repositoryOptions = readOmekaCatalogRepositoryOptions(process.env, omekaConfig.baseUrl);
  const [diagnostics, activeRepository] = await Promise.all([
    buildOmekaCatalogOperationalDiagnostics(client),
    createOmekaCatalogRepositoriesFromApi(client, repositoryOptions),
  ]);
  const cache = readOmekaCatalogRepositoryCacheSnapshot(repositoryOptions);
  const activeMappingRejected = activeRepository.catalog.quality.rejectedCount;

  return NextResponse.json({
    status:
      diagnostics.installation.readyForPnpuMapping &&
      diagnostics.snapshot.quality.rejected === 0 &&
      diagnostics.snapshot.unknown.total === 0 &&
      activeMappingRejected === 0
        ? "ready"
        : "degraded",
    catalogRepository: mode,
    omeka: {
      baseUrl: omekaConfig.baseUrl,
      cache,
      activeMapping: {
        warnings: activeRepository.catalog.quality.warningCount,
        rejected: activeMappingRejected,
        issues: activeRepository.catalog.quality.issues.slice(0, 20),
      },
      ...diagnostics,
    },
  });
}
