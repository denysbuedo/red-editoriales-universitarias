import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/admin/publication-imports/retention-plan", () => {
  it("requires endpoint configuration", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;

    try {
      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/retention-plan"),
      );

      await expect(response.json()).resolves.toEqual({
        code: "PNPU-503",
        message: "Publication import history endpoint is not configured.",
      });
      expect(response.status).toBe(503);
    } finally {
      if (previousToken !== undefined) {
        process.env.PNPU_PUBLICATION_IMPORT_TOKEN = previousToken;
      }
    }
  });

  it("returns a non destructive retention plan for uploaded XLSX files", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    const previousRoot = process.env.PNPU_PUBLICATION_IMPORT_ROOT;
    const previousRetentionDays = process.env.PNPU_PUBLICATION_IMPORT_RETENTION_DAYS;
    const importRoot = await mkTempImportRoot();
    const expiredPath = path.join(
      importRoot,
      "publishers",
      "editorial-uh",
      "lote-antiguo",
      "publicaciones.xlsx",
    );
    const currentPath = path.join(
      importRoot,
      "publishers",
      "editorial-uh",
      "lote-actual",
      "publicaciones.xlsx",
    );

    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";
    process.env.PNPU_PUBLICATION_IMPORT_ROOT = importRoot;
    process.env.PNPU_PUBLICATION_IMPORT_RETENTION_DAYS = "1";

    try {
      await mkdir(path.dirname(expiredPath), { recursive: true });
      await mkdir(path.dirname(currentPath), { recursive: true });
      await writeFile(expiredPath, "old");
      await writeFile(currentPath, "new");
      await utimes(
        expiredPath,
        new Date("2000-01-01T00:00:00.000Z"),
        new Date("2000-01-01T00:00:00.000Z"),
      );

      const response = await GET(
        new Request("https://pnpu.mes.gob.cu/api/admin/publication-imports/retention-plan", {
          headers: {
            "X-PNPU-Admin-Token": "expected-token",
          },
        }),
      );
      const payload = (await response.json()) as {
        readonly data: {
          readonly summary: {
            readonly files: number;
            readonly expiredFiles: number;
          };
          readonly files: readonly {
            readonly expired: boolean;
            readonly relativePath: string;
          }[];
        };
      };

      expect(response.status).toBe(200);
      expect(payload.data.summary.files).toBe(2);
      expect(payload.data.summary.expiredFiles).toBe(1);
      expect(payload.data.files).toContainEqual(
        expect.objectContaining({
          expired: true,
          relativePath: "publishers/editorial-uh/lote-antiguo/publicaciones.xlsx",
        }),
      );
    } finally {
      await rm(importRoot, { force: true, recursive: true });
      restoreEnv("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
      restoreEnv("PNPU_PUBLICATION_IMPORT_ROOT", previousRoot);
      restoreEnv("PNPU_PUBLICATION_IMPORT_RETENTION_DAYS", previousRetentionDays);
    }
  });
});

async function mkTempImportRoot(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "pnpu-import-retention-"));
}

function restoreEnv(
  name:
    | "PNPU_PUBLICATION_IMPORT_RETENTION_DAYS"
    | "PNPU_PUBLICATION_IMPORT_ROOT"
    | "PNPU_PUBLICATION_IMPORT_TOKEN",
  value: string | undefined,
): void {
  if (value === undefined) {
    if (name === "PNPU_PUBLICATION_IMPORT_TOKEN") {
      delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    } else if (name === "PNPU_PUBLICATION_IMPORT_ROOT") {
      delete process.env.PNPU_PUBLICATION_IMPORT_ROOT;
    } else {
      delete process.env.PNPU_PUBLICATION_IMPORT_RETENTION_DAYS;
    }
    return;
  }

  process.env[name] = value;
}
