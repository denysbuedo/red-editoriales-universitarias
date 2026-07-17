import { NextResponse } from "next/server";

import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { buildPrometheusMetrics } from "@/shared/observability/prometheus";

export const dynamic = "force-dynamic";

export function GET() {
  const metrics = buildPrometheusMetrics(getRuntimeConfig());

  return new NextResponse(metrics, {
    headers: {
      "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
