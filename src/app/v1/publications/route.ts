import { NextResponse } from "next/server";

import { toPublicationSummary } from "@/modules/catalog/application";
import { collectionResponse, errorResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { readPublicationListQuery } from "@/modules/catalog/interfaces/http/request-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { publicationService } = await createCatalogServices();
    const url = new URL(request.url);
    const publications = await publicationService.listPublications(
      readPublicationListQuery(url.searchParams),
    );

    return collectionResponse(request, {
      data: publications.data.map(toPublicationSummary),
      pagination: publications.pagination,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
}
