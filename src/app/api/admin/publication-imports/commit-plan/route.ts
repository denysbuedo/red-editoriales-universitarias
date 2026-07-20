import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import { createPublicationImportCommitPlanService } from "@/modules/publication-import/interfaces/http/publication-import-services";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportCommitPlanRequestBody {
  readonly packageJson?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = authorizeRequest(request);
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as PublicationImportCommitPlanRequestBody;

    if (typeof body.packageJson !== "string") {
      throw ApplicationError.validation("Publication import packageJson is required.");
    }

    const service = await createPublicationImportCommitPlanService();
    const commitPlan = await service.plan({
      packageJson: body.packageJson,
    });

    return NextResponse.json({
      data: commitPlan,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return commitPlanErrorResponse(request, error);
  }
}

function authorizeRequest(request: Request): NextResponse | null {
  const configuredToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

  if (configuredToken === undefined || configuredToken.trim().length === 0) {
    return NextResponse.json(
      {
        code: "PNPU-503",
        message: "Publication import commit-plan endpoint is not configured.",
      },
      { status: 503 },
    );
  }

  if (request.headers.get("X-PNPU-Admin-Token") !== configuredToken) {
    return NextResponse.json(
      {
        code: "PNPU-403",
        message: "Publication import commit-plan token is invalid.",
      },
      { status: 403 },
    );
  }

  return null;
}

function commitPlanErrorResponse(request: Request, error: unknown): NextResponse {
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
            message: "Publication import commit-plan failed.",
            correlationId,
          },
          { status: 503 },
        );

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}
