import { NextResponse } from "next/server";

import {
  PublicationService,
  toPublicationDetail,
  ZenodoMetadataExportService,
} from "@/modules/catalog/application";
import { createCatalogRepositoriesAsync } from "@/modules/catalog/infrastructure";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "zenodo export");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const repositories = await createCatalogRepositoriesAsync();
    const publicationService = new PublicationService(repositories.publicationRepository);
    const publications = await listAllPublicationDetails(publicationService);
    const exportPackage = new ZenodoMetadataExportService().buildPackage({ publications });

    return NextResponse.json(
      {
        data: exportPackage,
        meta: {
          apiVersion: "v1",
          exportType: "zenodo-metadata-candidate",
        },
      },
      {
        headers: {
          "Content-Disposition": `attachment; filename="pnpu-zenodo-metadata-${exportPackage.manifest.generatedAt.slice(0, 10)}.json"`,
        },
      },
    );
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Zenodo metadata candidate export failed.",
    );
  }
}

async function listAllPublicationDetails(
  publicationService: PublicationService,
): Promise<ReturnType<typeof toPublicationDetail>[]> {
  const publications: ReturnType<typeof toPublicationDetail>[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await publicationService.listPublications({
      page,
      pageSize: 100,
      sort: "publicationDateDesc",
    });

    publications.push(...result.data.map(toPublicationDetail));
    totalPages = result.pagination.totalPages;
    page += 1;
  }

  return publications;
}
