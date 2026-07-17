import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /version", () => {
  it("returns service version metadata", async () => {
    const response = GET();

    await expect(response.json()).resolves.toEqual({
      service: "pnpu-portal",
      version: "0.1.0",
      commitSha: null,
    });
    expect(response.status).toBe(200);
  });
});
