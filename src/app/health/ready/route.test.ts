import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /health/ready", () => {
  it("returns a ready status payload", async () => {
    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      status: "ready",
      service: "pnpu-portal",
      version: "0.1.0",
      commitSha: null,
      dependencies: {},
    });
    expect(response.status).toBe(200);
  });

  it("reports configured Omeka as available", async () => {
    const previousBaseUrl = process.env.PNPU_OMEKA_BASE_URL;

    process.env.PNPU_OMEKA_BASE_URL = "https://omeka.example.edu";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json([])));

    try {
      const response = await GET();

      await expect(response.json()).resolves.toMatchObject({
        dependencies: {
          omeka: "available",
        },
      });
    } finally {
      if (previousBaseUrl === undefined) {
        delete process.env.PNPU_OMEKA_BASE_URL;
      } else {
        process.env.PNPU_OMEKA_BASE_URL = previousBaseUrl;
      }
      vi.unstubAllGlobals();
    }
  });
});
