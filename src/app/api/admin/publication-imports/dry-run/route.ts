import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportDryRunService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportDryRunRequestBody {
  readonly sourcePath?: unknown;
  readonly sheet?: unknown;
  readonly enrichmentCsv?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "dry-run");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as PublicationImportDryRunRequestBody;

    if (typeof body.sourcePath !== "string") {
      throw ApplicationError.validation("Publication import sourcePath is required.");
    }

    if (body.sheet !== undefined && typeof body.sheet !== "string") {
      throw ApplicationError.validation("Publication import sheet must be a string.");
    }

    if (typeof body.enrichmentCsv !== "string") {
      throw ApplicationError.validation("Publication import enrichmentCsv is required.");
    }

    const service = createPublicationImportDryRunService();
    const dryRun = await service.dryRun({
      sourcePath: body.sourcePath,
      sheet: body.sheet,
      enrichmentCsv: body.enrichmentCsv,
    });

    return NextResponse.json({
      data: dryRun,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import dry-run failed.",
    );
  }
}
