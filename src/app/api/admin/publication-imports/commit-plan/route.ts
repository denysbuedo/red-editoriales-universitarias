import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { createPublicationImportCommitPlanService } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface PublicationImportCommitPlanRequestBody {
  readonly packageJson?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "commit-plan");
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
    return publicationImportAdminErrorResponse(
      request,
      error,
      "Publication import commit-plan failed.",
    );
  }
}
