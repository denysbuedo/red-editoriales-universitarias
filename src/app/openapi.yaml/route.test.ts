import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /openapi.yaml", () => {
  it("returns the OpenAPI contract as YAML", async () => {
    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("content-type")).toBe("application/yaml; charset=utf-8");
    expect(body).toContain("openapi: 3.1.0");
    expect(body).toContain("/health/live:");
  });
});
