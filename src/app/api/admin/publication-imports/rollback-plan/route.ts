import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import { createPublicationImportRollbackPlanService } from "@/modules/publication-import/interfaces/http/publication-import-services";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportRollbackPlanRequestBody {
  readonly auditId?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = authorizeRequest(request);
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as PublicationImportRollbackPlanRequestBody;

    if (typeof body.auditId !== "string") {
      throw ApplicationError.validation("Publication import auditId is required.");
    }

    const service = createPublicationImportRollbackPlanService();
    const rollbackPlan = await service.plan({
      auditId: body.auditId,
    });

    return NextResponse.json({
      data: rollbackPlan,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return rollbackPlanErrorResponse(request, error);
  }
}

function authorizeRequest(request: Request): NextResponse | null {
  const configuredToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

  if (configuredToken === undefined || configuredToken.trim().length === 0) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Publication import rollback-plan endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  if (request.headers.get("X-PNPU-Admin-Token") !== configuredToken) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: "Publication import rollback-plan token is invalid.",
      },
      { status: 403 },
    );
  }

  return null;
}

function rollbackPlanErrorResponse(request: Request, error: unknown): NextResponse {
  const correlationId = resolveCorrelationId(request.headers);
  const response =
    error instanceof ApplicationError
      ? NextResponse.json(
          {
            code: error.code,
            message: error.message,
            correlationId,
          },
          { status: error.code === "PNPU-404" ? 404 : error.code === "PNPU-422" ? 422 : 503 },
        )
      : NextResponse.json(
          {
            code: "PNPU-503",
            message: "Publication import rollback-plan failed.",
            correlationId,
          },
          { status: 503 },
        );

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}
