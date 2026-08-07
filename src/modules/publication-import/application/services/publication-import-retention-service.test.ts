import { mkdir, mkdtemp, rm, utimes, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PublicationImportRetentionService } from "./publication-import-retention-service";

describe("PublicationImportRetentionService", () => {
  it("plans retention only for XLSX files under publisher import batches", async () => {
    const importRoot = await mkdtemp(path.join(os.tmpdir(), "pnpu-retention-service-"));
    const expiredPath = path.join(
      importRoot,
      "publishers",
      "editorial-uh",
      "lote-2020",
      "publicaciones.xlsx",
    );
    const ignoredPath = path.join(importRoot, "publishers", "editorial-uh", "notas.txt");

    try {
      await mkdir(path.dirname(expiredPath), { recursive: true });
      await writeFile(expiredPath, "xlsx");
      await writeFile(ignoredPath, "text");
      await utimes(
        expiredPath,
        new Date("2020-01-01T00:00:00.000Z"),
        new Date("2020-01-01T00:00:00.000Z"),
      );

      const service = new PublicationImportRetentionService({
        importRoot,
        now: () => new Date("2026-08-07T00:00:00.000Z"),
        retentionDays: 30,
      });

      const plan = await service.plan();

      expect(plan.generatedAt).toBe("2026-08-07T00:00:00.000Z");
      expect(plan.summary.files).toBe(1);
      expect(plan.summary.expiredFiles).toBe(1);
      expect(plan.files[0]).toEqual(
        expect.objectContaining({
          expired: true,
          relativePath: "publishers/editorial-uh/lote-2020/publicaciones.xlsx",
        }),
      );
    } finally {
      await rm(importRoot, { force: true, recursive: true });
    }
  });

  it("returns an empty plan when the import root does not exist", async () => {
    const service = new PublicationImportRetentionService({
      importRoot: path.join(os.tmpdir(), `pnpu-retention-missing-root-${randomUUID()}`),
      now: () => new Date("2026-08-07T00:00:00.000Z"),
      retentionDays: 365,
    });

    await expect(service.plan()).resolves.toMatchObject({
      summary: {
        files: 0,
        expiredFiles: 0,
      },
    });
  });
});
