import { NextResponse } from "next/server";

import { toSubjectAuthoritySummary } from "@/modules/catalog/application";
import { collectionResponse, errorResponse } from "@/modules/catalog/interfaces/http/api-responses";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { readPagination } from "@/modules/catalog/interfaces/http/request-query";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const { subjectService } = await createCatalogServices();
    const url = new URL(request.url);
    const subjects = await subjectService.listSubjects(readPagination(url.searchParams));

    return collectionResponse(request, {
      data: subjects.data.map((profile) =>
        toSubjectAuthoritySummary(profile.subject, profile.publications.length),
      ),
      pagination: subjects.pagination,
    });
  } catch (error) {
    return errorResponse(request, error);
  }
}
