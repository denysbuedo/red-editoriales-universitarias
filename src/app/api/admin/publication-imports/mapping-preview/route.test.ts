import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/mapping-preview", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/mapping-preview", {
          method: "POST",
          body: JSON.stringify({ sourcePath: "Listado.xlsx" }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import mapping preview endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("validates maxRows", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/mapping-preview", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
            "X-Correlation-Id": "preview-request-1",
          },
          body: JSON.stringify({ sourcePath: "Listado.xlsx", maxRows: 0 }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        message: "Publication import maxRows must be between 1 and 500.",
        correlationId: "preview-request-1",
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

  it("returns a mapping preview for an allowed local spreadsheet", async () => {
    const fixturePath = path.resolve("Readme", "Listado_Libro_Publicados_EDUNIV.xlsx");
    if (!existsSync(fixturePath)) {
      return;
    }

    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousRoot = process.env.PNPU_PUBLICATION_IMPORT_ROOT;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_PUBLICATION_IMPORT_ROOT = "Readme";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/mapping-preview", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
          body: JSON.stringify({
            sourcePath: "Listado_Libro_Publicados_EDUNIV.xlsx",
            maxRows: 5,
          }),
        }),
      );

      await expect(response.json()).resolves.toMatchObject({
        data: {
          summary: {
            totalRows: 659,
            mappable: 0,
          },
          rows: [
            {
              decision: "needs_enrichment",
            },
            {},
            {},
            {},
            {},
          ],
        },
        meta: {
          apiVersion: "v1",
        },
      });
      expect(response.status).toBe(200);
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }

      if (previousRoot === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_ROOT;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_ROOT = previousRoot;
      }
    }
  });
});
