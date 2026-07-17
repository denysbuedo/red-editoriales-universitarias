import { NextResponse } from "next/server";

import { toSubjectDetail } from "@/modules/catalog/application";
import { errorResponse, itemResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const dynamic = "force-dynamic";

interface SubjectRouteContext {
  readonly params: Promise<{
    readonly identifier: string;
  }>;
}

export async function GET(request: Request, context: SubjectRouteContext): Promise<NextResponse> {
  try {
    const { identifier } = await context.params;
    const { subjectService } = await createCatalogServices();
    const profile = await subjectService.getSubject(decodeURIComponent(identifier));

    return itemResponse(request, toSubjectDetail(profile.subject, profile.publications));
  } catch (error) {
    return errorResponse(request, error);
  }
}
