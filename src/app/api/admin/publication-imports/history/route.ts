import { NextResponse } from "next/server";

import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportAuditService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "history");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const service = createPublicationImportAuditService();
    const history = await service.list();

    return NextResponse.json({
      data: history,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import history lookup failed.",
    );
  }
}
