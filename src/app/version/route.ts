import { NextResponse } from "next/server";

import { getRuntimeConfig } from "@/shared/config/runtime-config";

export const dynamic = "force-dynamic";

export function GET() {
  const runtimeConfig = getRuntimeConfig();

  return NextResponse.json({
    service: runtimeConfig.serviceName,
    version: runtimeConfig.version,
    commitSha: runtimeConfig.commitSha,
  });
}
