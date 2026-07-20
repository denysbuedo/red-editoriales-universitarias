import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportRollbackService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportRollbackRequestBody {
  readonly auditId?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = authorizePublicationImportAdminRequest(request, "rollback");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const body = (await request.json()) as PublicationImportRollbackRequestBody;

    if (typeof body.auditId !== "string") {
      throw ApplicationError.validation("Publication import auditId is required.");
    }

    const service = createPublicationImportRollbackService();
    const rollback = await service.rollback({
      auditId: body.auditId,
    });

    return NextResponse.json({
      data: rollback,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import rollback failed.",
    );
  }
}
