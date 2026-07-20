import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import { createPublicationImportMappingPreviewService } from "@/modules/publication-import/interfaces/http/publication-import-services";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportMappingPreviewRequestBody {
  readonly sourcePath?: unknown;
  readonly sheet?: unknown;
  readonly maxRows?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = authorizeRequest(request);
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
    return mappingPreviewErrorResponse(request, error);
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

function authorizeRequest(request: Request): NextResponse | null {
  const configuredToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

  if (configuredToken === undefined || configuredToken.trim().length === 0) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Publication import mapping preview endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  if (request.headers.get("X-PNPU-Admin-Token") !== configuredToken) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: "Publication import mapping preview token is invalid.",
      },
      { status: 403 },
    );
  }

  return null;
}

function mappingPreviewErrorResponse(request: Request, error: unknown): NextResponse {
  const correlationId = resolveCorrelationId(request.headers);
  const response =
    error instanceof ApplicationError
      ? NextResponse.json(
          {
            code: error.code,
            message: error.message,
            correlationId,
          },
          { status: error.code === "PNPU-422" ? 422 : 503 },
        )
      : NextResponse.json(
          {
            code: "PNPU-503",
            message: "Publication import mapping preview failed.",
            correlationId,
          },
          { status: 503 },
        );

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}
