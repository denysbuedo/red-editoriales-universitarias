import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { POST } from "./route";

describe("POST /api/admin/publication-imports/upload", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/upload", {
          method: "POST",
          body: new FormData(),
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import diagnosis endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
    }
  });

  it("stores an uploaded XLSX under the selected publisher workspace", async () => {
    const importRoot = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-upload-"));
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousRoot = process.env.PNPU_PUBLICATION_IMPORT_ROOT;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_PUBLICATION_IMPORT_ROOT = importRoot;

    try {
      const formData = new FormData();
      formData.set("publisherId", "editorial-piloto");
      formData.set("batchLabel", "primer-lote");
      formData.set(
        "file",
        new File([new Uint8Array([80, 75, 3, 4])], "Publicaciones Piloto.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );

      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/upload", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
          body: formData,
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly publisherId: string;
          readonly relativeSourcePath: string;
          readonly size: number;
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.publisherId).toBe("editorial-piloto");
      expect(payload.data.relativeSourcePath).toMatch(
        /^publishers\/editorial-piloto\/\d{8}t\d{6}z-primer-lote\/publicaciones-piloto.xlsx$/u,
      );
      expect(payload.data.size).toBe(4);
      await expect(
        readFile(path.join(importRoot, payload.data.relativeSourcePath)),
      ).resolves.toEqual(Buffer.from([80, 75, 3, 4]));
    } finally {
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_ROOT", previousRoot);
      await rm(importRoot, { force: true, recursive: true });
    }
  });

  it("rejects non-XLSX uploads", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    const formData = new FormData();
    formData.set("publisherId", "editorial-piloto");
    formData.set("file", new File(["x"], "datos.csv", { type: "text/csv" }));

    try {
      const response = await POST(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/upload", {
          method: "POST",
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
            "X-Correlation-Id": "upload-request-1",
          },
          body: formData,
        }),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-422",
        message: "Publication import upload must be an .xlsx file.",
        correlationId: "upload-request-1",
      });
      expect(response.status).toBe(422);
    } finally {
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
    }
  });
});

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
}
