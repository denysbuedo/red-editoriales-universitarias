import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import { createPublicationImportCommitService } from "@/modules/publication-import/interfaces/http/publication-import-services";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportCommitRequestBody {
  readonly packageJson?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = authorizeRequest(request);
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as PublicationImportCommitRequestBody;

    if (typeof body.packageJson !== "string") {
      throw ApplicationError.validation("Publication import packageJson is required.");
    }

    const service = await createPublicationImportCommitService();
    const commit = await service.commit({
      packageJson: body.packageJson,
    });

    return NextResponse.json({
      data: commit,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return commitErrorResponse(request, error);
  }
}

function authorizeRequest(request: Request): NextResponse | null {
  const configuredToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

  if (configuredToken === undefined || configuredToken.trim().length === 0) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Publication import commit endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  if (request.headers.get("X-PNPU-Admin-Token") !== configuredToken) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: "Publication import commit token is invalid.",
      },
      { status: 403 },
    );
  }

  return null;
}

function commitErrorResponse(request: Request, error: unknown): NextResponse {
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
            message: "Publication import commit failed.",
            correlationId,
          },
          { status: 503 },
        );

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}
