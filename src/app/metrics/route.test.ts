import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /metrics", () => {
  it("returns Prometheus text exposition", async () => {
    const response = GET();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe("text/plain; version=0.0.4; charset=utf-8");
    expect(body).toContain("pnpu_portal_build_info");
    expect(body).toContain("pnpu_portal_process_uptime_seconds");
  });
});
