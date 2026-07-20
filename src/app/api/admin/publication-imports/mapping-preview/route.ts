import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportMappingPreviewService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportMappingPreviewRequestBody {
  readonly sourcePath?: unknown;
  readonly sheet?: unknown;
  readonly maxRows?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "mapping preview");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as PublicationImportMappingPreviewRequestBody;

    if (typeof body.sourcePath !== "string") {
      throw ApplicationError.validation("Publication import sourcePath is required.");
    }

    if (body.sheet !== undefined && typeof body.sheet !== "string") {
      throw ApplicationError.validation("Publication import sheet must be a string.");
    }

    const maxRows = readMaxRows(body.maxRows);
    if (maxRows === null) {
      throw ApplicationError.validation("Publication import maxRows must be between 1 and 500.");
    }

    const service = createPublicationImportMappingPreviewService();
    const preview = await service.preview({
      sourcePath: body.sourcePath,
      sheet: body.sheet,
      maxRows,
    });

    return NextResponse.json({
      data: preview,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import mapping preview failed.",
    );
  }
}

function readMaxRows(value: unknown): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 500) {
    return null;
  }

  return value;
}
