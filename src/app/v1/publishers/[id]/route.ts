import { NextResponse } from "next/server";

import { toPublisherDetail } from "@/modules/catalog/application";
import { errorResponse, itemResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const dynamic = "force-dynamic";

interface PublisherRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function GET(request: Request, context: PublisherRouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { publisherService } = await createCatalogServices();
    const publisher = await publisherService.getPublisher(id);

    return itemResponse(request, toPublisherDetail(publisher));
  } catch (error) {
    return errorResponse(request, error);
  }
}
