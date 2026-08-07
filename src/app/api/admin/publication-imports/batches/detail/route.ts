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

export async function GET(request: Request): Promise<NextResponse> {
  const adminTokenResponse = await authorizePublicationImportAdminRequest(request, "history");
  if (adminTokenResponse !== null) {
    return adminTokenResponse;
  }

  try {
    const requestUrl = new URL(request.url);
    const sourcePath = requestUrl.searchParams.get("sourcePath")?.trim();

    if (sourcePath === undefined || sourcePath.length === 0) {
      throw ApplicationError.validation("Publication import sourcePath is required.");
    }

    const tokenResponse = await authorizePublicationImportSourcePathScopeRequest(
      request,
      "history",
      sourcePath,
    );

    if (tokenResponse !== null) {
      return tokenResponse;
    }

    const batch = await createPublicationImportWorkflowService().get({
      relativeSourcePath: sourcePath,
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
      "Publication import batch detail failed.",
    );
  }
}
