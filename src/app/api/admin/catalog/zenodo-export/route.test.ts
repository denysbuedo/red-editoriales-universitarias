import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/admin/catalog/zenodo-export", () => {
  it("exports a protected Zenodo metadata candidate package", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousRepository = process.env.PNPU_CATALOG_REPOSITORY;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_CATALOG_REPOSITORY = "in-memory";

    try {
      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/catalog/zenodo-export", {
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly manifest: {
            readonly profile: string;
            readonly exportedPublications: number;
          };
          readonly records: readonly unknown[];
        };
        readonly meta: {
          readonly exportType: string;
        };
      };

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Disposition")).toContain("pnpu-zenodo-metadata-");
      expect(payload.data.manifest.profile).toBe("PNPU_ZENODO_METADATA_CANDIDATE_V1");
      expect(payload.data.manifest.exportedPublications).toBeGreaterThan(0);
      expect(payload.data.records.length).toBe(payload.data.manifest.exportedPublications);
      expect(payload.meta.exportType).toBe("zenodo-metadata-candidate");
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
      if (previousRepository === undefined) {
        delete process.env.PNPU_CATALOG_REPOSITORY;
      } else {
        process.env.PNPU_CATALOG_REPOSITORY = previousRepository;
      }
    }
  });
});
