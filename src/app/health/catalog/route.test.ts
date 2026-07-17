import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /health/catalog", () => {
  it("reports missing Omeka configuration", async () => {
    const previousBaseUrl = process.env.PNPU_OMEKA_BASE_URL;
    delete process.env.PNPU_OMEKA_BASE_URL;

    try {
      const response = await GET();

      await expect(response.json()).resolves.toMatchObject({
        status: "not-configured",
        catalogRepository: "in-memory",
        omeka: null,
      });
    } finally {
      if (previousBaseUrl !== undefined) {
        process.env.PNPU_OMEKA_BASE_URL = previousBaseUrl;
      }
    }
  });
});
