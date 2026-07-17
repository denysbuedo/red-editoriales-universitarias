import { NextResponse } from "next/server";

import { checkOmekaHealth, readOmekaConfig } from "@/modules/catalog/infrastructure";
import { getRuntimeConfig } from "@/shared/config/runtime-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const runtimeConfig = getRuntimeConfig();
  const dependencies = await getDependencies();

  return NextResponse.json({
    status: "ready",
    service: runtimeConfig.serviceName,
    version: runtimeConfig.version,
    commitSha: runtimeConfig.commitSha,
    dependencies,
  });
}

async function getDependencies(): Promise<Record<string, string>> {
  try {
    const omekaConfig = readOmekaConfig();

    if (omekaConfig === null) {
      return {};
    }

    return {
      omeka: await checkOmekaHealth(omekaConfig),
    };
  } catch {
    return {
      omeka: "misconfigured",
    };
  }
}
