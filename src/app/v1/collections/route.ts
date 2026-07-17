import { NextResponse } from "next/server";

import { toCollectionSummary } from "@/modules/catalog/application";
import { collectionResponse, errorResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { readPagination } from "@/modules/catalog/interfaces/http/request-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { collectionService } = await createCatalogServices();
    const url = new URL(request.url);
    const collections = await collectionService.listCollections(readPagination(url.searchParams));

    return collectionResponse(request, {
      data: collections.data.map((profile) =>
        toCollectionSummary(profile.collection, profile.publications.length),
      ),
      pagination: collections.pagination,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
}
