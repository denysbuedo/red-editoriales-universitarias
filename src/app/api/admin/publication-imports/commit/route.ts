import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportCommitService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportCommitRequestBody {
  readonly packageJson?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "commit");
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
    return publicationImportAdminErrorResponse(request, error, "Publication import commit failed.");
  }
}
