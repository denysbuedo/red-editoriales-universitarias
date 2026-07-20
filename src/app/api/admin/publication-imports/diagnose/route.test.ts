import { describe, expect, it } from "vitest";
import path from "node:path";
import { existsSync } from "node:fs";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/diagnose", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/diagnose", {
          method: "POST",
          body: JSON.stringify({ sourcePath: "Listado.xlsx" }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import diagnosis endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("rejects invalid tokens", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/diagnose", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "wrong-token",
          },
          body: JSON.stringify({ sourcePath: "Listado.xlsx" }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-403",
        message: "Publication import diagnosis token is invalid.",
      });
      expect(response.status).toBe(403);
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("validates request body", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/diagnose", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
            "X-Correlation-Id": "import-request-1",
          },
          body: JSON.stringify({ sourcePath: 42 }),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        message: "Publication import sourcePath is required.",
        correlationId: "import-request-1",
      });
      expect(response.status).toBe(422);
      expect(response.headers.get("X-Correlation-Id")).toBe("import-request-1");
    } finally {
      if (previousToken === undefined) {
        delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
      } else {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("returns a diagnosed import batch for an allowed local spreadsheet", async () => {
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
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/diagnose", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
          body: JSON.stringify({
            sourcePath: "Listado_Libro_Publicados_EDUNIV.xlsx",
          }),
        }),
      );

      await expect(response.json()).resolves.toMatchObject({
        data: {
          status: "needs_correction",
          sheet: "EDUNIV",
          diagnostics: {
            summary: {
              rowCount: 659,
              duplicateIsbnCount: 1,
            },
          },
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
