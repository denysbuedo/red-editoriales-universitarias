import { NextResponse } from "next/server";

import { buildPublicationImportAdminLoginResponse } from "@/modules/publication-import/interfaces/http/publication-import-admin-http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request): Promise<NextResponse> {
  return buildPublicationImportAdminLoginResponse(request);
}
