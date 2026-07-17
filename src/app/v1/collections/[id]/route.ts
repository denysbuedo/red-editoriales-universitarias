import { NextResponse } from "next/server";

import { toCollectionDetail } from "@/modules/catalog/application";
import { errorResponse, itemResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const dynamic = "force-dynamic";

interface CollectionRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function GET(
  request: Request,
  context: CollectionRouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { collectionService } = await createCatalogServices();
    const profile = await collectionService.getCollection(id);

    return itemResponse(request, toCollectionDetail(profile.collection, profile.publications));
  } catch (error) {
    return errorResponse(request, error);
  }
}
