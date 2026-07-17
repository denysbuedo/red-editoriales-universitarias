import { NextResponse } from "next/server";

import { toContributorDetail } from "@/modules/catalog/application";
import { errorResponse, itemResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const dynamic = "force-dynamic";

interface ContributorRouteContext {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function GET(
  request: Request,
  context: ContributorRouteContext,
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const { contributorService } = await createCatalogServices();
    const profile = await contributorService.getContributor(id);

    return itemResponse(request, toContributorDetail(profile.contributor, profile.publications));
  } catch (error) {
    return errorResponse(request, error);
  }
}
