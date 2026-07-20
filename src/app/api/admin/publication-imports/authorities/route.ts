import { NextResponse } from "next/server";

import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportAuthoritiesService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "authorities");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const service = await createPublicationImportAuthoritiesService();
    const authorities = await service.listAuthorities();

    return NextResponse.json({
      data: authorities,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import authorities lookup failed.",
    );
  }
}
