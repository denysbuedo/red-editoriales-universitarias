import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportReviewDecisionRequestBody {
  readonly decision?: unknown;
  readonly message?: unknown;
  readonly sourcePath?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "commit-plan");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as PublicationImportReviewDecisionRequestBody;

    if (typeof body.sourcePath !== "string") {
      throw ApplicationError.validation("Publication import sourcePath is required.");
    }

    if (body.decision !== "approved" && body.decision !== "rejected") {
      throw ApplicationError.validation("Publication import review decision is invalid.");
    }

    if (body.message !== undefined && typeof body.message !== "string") {
      throw ApplicationError.validation("Publication import review message is invalid.");
    }

    const batch = await createPublicationImportWorkflowService().review({
      decision: body.decision,
      message: body.message,
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
      "Publication import review decision failed.",
    );
  }
}
