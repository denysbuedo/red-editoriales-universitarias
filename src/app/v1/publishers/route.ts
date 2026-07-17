import { NextResponse } from "next/server";

import { toPublisherSummary } from "@/modules/catalog/application";
import { collectionResponse, errorResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { readPagination } from "@/modules/catalog/interfaces/http/request-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { publisherService } = await createCatalogServices();
    const url = new URL(request.url);
    const publishers = await publisherService.listPublishers(readPagination(url.searchParams));

    return collectionResponse(request, {
      data: publishers.data.map(toPublisherSummary),
      pagination: publishers.pagination,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
}
