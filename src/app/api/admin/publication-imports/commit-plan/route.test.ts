import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/commit-plan", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit-plan", {
          method: "POST",
          body: JSON.stringify({ packageJson: "{}" }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import commit-plan endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("validates package JSON", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit-plan", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
            "X-Correlation-Id": "commit-plan-request-1",
          },
          body: JSON.stringify({ packageJson: "" }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        message: "Publication import packageJson is required.",
        correlationId: "commit-plan-request-1",
      });
      expect(response.status).toBe(422);
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("returns a non-executed commit plan for ready candidates", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/commit-plan", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
          body: JSON.stringify({ packageJson: JSON.stringify(buildReadyPackage()) }),
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly status: string;
          readonly summary: {
            readonly candidates: number;
            readonly operations: number;
            readonly risks: number;
          };
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.status).toBe("planned_not_executed");
      expect(payload.data.summary).toEqual({
        candidates: 1,
        operations: 6,
        risks: 0,
      });
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });
});

function buildReadyPackage(): unknown {
  return {
    manifest: {
      source: "source.xlsx",
      sheet: "EDUNIV",
      status: "validated_not_imported",
    },
    candidates: [
      {
        row: 2,
        title: "Libro listo",
        isbn: "9789590000997",
        doi: "",
        publicationDate: "2026-07-19",
        publisher: "Editorial Universitaria",
        contributorAuthorityIds: ["contributor-1"],
        publisherAuthorityId: "publisher-1",
        typeOrGenre: "book",
        formats: ["pdf"],
        digitalResourceUrl: "https://example.edu/libro.pdf",
        language: "es",
        subjects: ["unesco:1203"],
        license: "CC BY",
        decision: "ready",
        reasons: [],
      },
    ],
  };
}
