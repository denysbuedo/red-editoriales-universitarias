import { NextResponse } from "next/server";

import { toPublicationDetail } from "@/modules/catalog/application";
import { errorResponse, itemResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const dynamic = "force-dynamic";

interface PublicationRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function GET(
  request: Request,
  context: PublicationRouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { publicationService } = await createCatalogServices();
    const publication = await publicationService.getPublication(id);

    return itemResponse(request, toPublicationDetail(publication));
  } catch (error) {
    return errorResponse(request, error);
  }
}
