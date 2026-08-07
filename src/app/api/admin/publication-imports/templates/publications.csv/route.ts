import { NextResponse } from "next/server";

import { PublicationImportTemplateService } from "@/modules/publication-import";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "upload");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const template = new PublicationImportTemplateService().buildBasePublicationTemplate();

    return new NextResponse(template.content, {
      headers: {
        "Content-Disposition": `attachment; filename="${template.fileName}"`,
        "Content-Type": template.contentType,
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import base template download failed.",
    );
  }
}
