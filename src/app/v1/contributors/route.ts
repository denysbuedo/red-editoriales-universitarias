import { NextResponse } from "next/server";

import { toContributorAuthoritySummary } from "@/modules/catalog/application";
import { collectionResponse, errorResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { readPagination } from "@/modules/catalog/interfaces/http/request-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { contributorService } = await createCatalogServices();
    const url = new URL(request.url);
    const contributors = await contributorService.listContributors(
      readPagination(url.searchParams),
    );

    return collectionResponse(request, {
      data: contributors.data.map((profile) =>
        toContributorAuthoritySummary(profile.contributor, profile.publications.length),
      ),
      pagination: contributors.pagination,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
}
