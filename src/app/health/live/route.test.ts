import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /health/live", () => {
  it("returns a live status payload", async () => {
    const response = GET();

    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "pnpu-portal",
      version: "0.1.0",
      commitSha: null,
    });
    expect(response.status).toBe(200);
  });
});
