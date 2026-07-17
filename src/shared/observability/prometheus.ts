import type { RuntimeConfig } from "@/shared/config/runtime-config";

function metricLine(name: string, labels: Record<string, string>, value: number): string {
  const serializedLabels = Object.entries(labels)
    .map(([key, labelValue]) => `${key}="${labelValue.replaceAll('"', '\\"')}"`)
    .join(",");

  return `${name}{${serializedLabels}} ${String(value)}`;
}

export function buildPrometheusMetrics(runtimeConfig: RuntimeConfig): string {
  const labels = {
    service: runtimeConfig.serviceName,
    version: runtimeConfig.version,
    commit: runtimeConfig.commitSha ?? "unknown",
  };

  return [
    "# HELP pnpu_portal_build_info Portal build metadata.",
    "# TYPE pnpu_portal_build_info gauge",
    metricLine("pnpu_portal_build_info", labels, 1),
    "# HELP pnpu_portal_process_uptime_seconds Node.js process uptime in seconds.",
    "# TYPE pnpu_portal_process_uptime_seconds gauge",
    `pnpu_portal_process_uptime_seconds ${String(Math.floor(process.uptime()))}`,
    "",
  ].join("\n");
}
