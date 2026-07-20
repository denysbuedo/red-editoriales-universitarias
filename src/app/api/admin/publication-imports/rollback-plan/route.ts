import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportRollbackPlanService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportRollbackPlanRequestBody {
  readonly auditId?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "rollback-plan");
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
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import rollback-plan failed.",
    );
  }
}
