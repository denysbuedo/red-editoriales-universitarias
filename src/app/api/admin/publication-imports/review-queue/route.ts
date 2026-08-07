import { NextResponse } from "next/server";

import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "commit-plan");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const workflow = await createPublicationImportWorkflowService().listReviewQueue();

    return NextResponse.json({
      data: workflow,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import review queue listing failed.",
    );
  }
}
