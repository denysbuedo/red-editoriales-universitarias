import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportPublisherScopeRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportWorkflowService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const requestUrl = new URL(request.url);
    const publisherId = requestUrl.searchParams.get("publisherId")?.trim().toLowerCase();

    if (publisherId === undefined || publisherId.length === 0) {
      throw ApplicationError.validation("Publication import publisherId is required.");
    }

    const tokenResponse = await authorizePublicationImportPublisherScopeRequest(
      request,
      "history",
      publisherId,
    );

    if (tokenResponse !== null) {
      return tokenResponse;
    }

    const workflow = await createPublicationImportWorkflowService().list({ publisherId });

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
      "Publication import batch listing failed.",
    );
  }
}
