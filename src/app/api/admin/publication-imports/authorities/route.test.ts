import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/admin/publication-imports/authorities", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/authorities"),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import authorities endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("returns catalog authorities for enrichment", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/authorities", {
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly summary: {
            readonly publishers: number;
            readonly contributors: number;
            readonly subjects: number;
          };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.summary.publishers).toBeGreaterThan(0);
      expect(payload.data.summary.contributors).toBeGreaterThan(0);
      expect(payload.data.summary.subjects).toBeGreaterThan(0);
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });
});
