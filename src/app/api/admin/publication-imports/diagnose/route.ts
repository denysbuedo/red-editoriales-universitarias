import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  authorizePublicationImportSourcePathScopeRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import {
  createPublicationImportDiagnosisService,
  createPublicationImportWorkflowService,
} from "@/modules/publication-import/interfaces/http/publication-import-services";
import { readPublicationImportWorkflowIdentityFromSourcePath } from "@/modules/publication-import/interfaces/http/publication-import-workflow-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface DiagnosePublicationImportRequestBody {
  readonly sourcePath?: unknown;
  readonly sheet?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "diagnosis");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as DiagnosePublicationImportRequestBody;

    if (typeof body.sourcePath !== "string") {
      throw ApplicationError.validation("Publication import sourcePath is required.");
    }

    const sourcePathScopeResponse = await authorizePublicationImportSourcePathScopeRequest(
      request,
      "diagnosis",
      body.sourcePath,
    );

    if (sourcePathScopeResponse !== null) {
      return sourcePathScopeResponse;
    }

    if (body.sheet !== undefined && typeof body.sheet !== "string") {
      throw ApplicationError.validation("Publication import sheet must be a string.");
    }

    const service = createPublicationImportDiagnosisService();
    const batch = await service.diagnose({
      sourcePath: body.sourcePath,
      sheet: body.sheet,
    });
    const workflowIdentity = readPublicationImportWorkflowIdentityFromSourcePath(body.sourcePath);
    await createPublicationImportWorkflowService().record({
      ...workflowIdentity,
      message: `Diagnóstico ejecutado. Estado: ${batch.status}.`,
      relativeSourcePath: body.sourcePath,
      sheet: body.sheet,
      status: batch.status === "needs_correction" ? "needs_correction" : "diagnosed",
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
      "Publication import diagnosis failed.",
    );
  }
}
