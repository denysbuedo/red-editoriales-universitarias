import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportDiagnosisService } from "@/modules/publication-import/interfaces/http/publication-import-services";

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

    if (body.sheet !== undefined && typeof body.sheet !== "string") {
      throw ApplicationError.validation("Publication import sheet must be a string.");
    }

    const service = createPublicationImportDiagnosisService();
    const batch = await service.diagnose({
      sourcePath: body.sourcePath,
      sheet: body.sheet,
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
