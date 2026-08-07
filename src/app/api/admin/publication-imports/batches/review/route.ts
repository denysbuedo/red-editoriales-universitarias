import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  authorizePublicationImportSourcePathScopeRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface SubmitPublicationImportReviewRequestBody {
  readonly sourcePath?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "history");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as SubmitPublicationImportReviewRequestBody;

    if (typeof body.sourcePath !== "string") {
      throw ApplicationError.validation("Publication import sourcePath is required.");
    }

    const sourcePathScopeResponse = await authorizePublicationImportSourcePathScopeRequest(
      request,
      "history",
      body.sourcePath,
    );

    if (sourcePathScopeResponse !== null) {
      return sourcePathScopeResponse;
    }

    const batch = await createPublicationImportWorkflowService().submitForReview({
      relativeSourcePath: body.sourcePath,
    });

    return NextResponse.json({
      data: batch,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import review submission failed.",
    );
  }
}
