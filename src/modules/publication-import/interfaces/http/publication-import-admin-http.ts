import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

export function authorizePublicationImportAdminRequest(
  request: Request,
  operation: string,
): NextResponse | null {
  const configuredToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

  if (configuredToken === undefined || configuredToken.trim().length === 0) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: `Publication import ${operation} endpoint is not configured.`,
      },
      { status: 503 },
    );
  }

  if (request.headers.get("X-PNPU-Admin-Token") !== configuredToken) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: `Publication import ${operation} token is invalid.`,
      },
      { status: 403 },
    );
  }

  return null;
}

export function publicationImportAdminErrorResponse(
  request: Request,
  error: unknown,
  fallbackMessage: string,
): NextResponse {
  const correlationId = resolveCorrelationId(request.headers);
  const response =
    error instanceof ApplicationError
      ? NextResponse.json(
          {
            code: error.code,
            message: error.message,
            correlationId,
          },
          { status: statusForApplicationError(error) },
        )
      : NextResponse.json(
          {
            code: "PNPU-503",
            message: fallbackMessage,
            correlationId,
          },
          { status: 503 },
        );

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}

function statusForApplicationError(error: ApplicationError): number {
  if (error.code === "PNPU-404") {
    return 404;
  }

  if (error.code === "PNPU-422") {
    return 422;
  }

  return 503;
}
