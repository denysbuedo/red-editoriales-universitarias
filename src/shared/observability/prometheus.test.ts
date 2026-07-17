import { describe, expect, it } from "vitest";

import { buildPrometheusMetrics } from "./prometheus";

describe("buildPrometheusMetrics", () => {
  it("emits build metadata and uptime metrics", () => {
    const metrics = buildPrometheusMetrics({
      serviceName: "pnpu-portal",
      version: "0.1.0",
      commitSha: "abc123",
      publicBaseUrl: "http://127.0.0.1:4307",
    });

    expect(metrics).toContain("# TYPE pnpu_portal_build_info gauge");
    expect(metrics).toContain(
      'pnpu_portal_build_info{service="pnpu-portal",version="0.1.0",commit="abc123"} 1',
    );
    expect(metrics).toContain("pnpu_portal_process_uptime_seconds");
  });
});
