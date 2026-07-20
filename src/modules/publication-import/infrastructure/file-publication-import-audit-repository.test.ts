import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { FilePublicationImportAuditRepository } from "./file-publication-import-audit-repository";

describe("FilePublicationImportAuditRepository", () => {
  it("stores audit entries as local manifests sorted by commit date", async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), "pnpu-import-audit-"));
    const repository = new FilePublicationImportAuditRepository(directory);

    try {
      await repository.append({
        id: "audit-1",
        committedAt: "2026-07-20T15:00:00.000Z",
        source: "source.xlsx",
        sheet: "EDUNIV",
        status: "committed",
        summary: {
          candidates: 1,
          createdItems: 1,
          createdMedia: 0,
        },
        created: [
          {
            row: 2,
            pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
            omekaItemId: 9001,
          },
        ],
      });
      await repository.append({
        id: "audit-2",
        committedAt: "2026-07-20T16:00:00.000Z",
        source: "source.xlsx",
        sheet: "EDUNIV",
        status: "committed",
        summary: {
          candidates: 1,
          createdItems: 1,
          createdMedia: 1,
        },
        created: [
          {
            row: 3,
            pnpuUuid: "01990f5a-0000-7000-8000-000000000902",
            omekaItemId: 9003,
            omekaMediaId: 9004,
          },
        ],
      });

      await expect(repository.list()).resolves.toMatchObject([
        { id: "audit-2" },
        { id: "audit-1" },
      ]);
      await expect(repository.get("audit-1")).resolves.toMatchObject({ id: "audit-1" });
      await repository.appendRollback({
        rollbackId: "rollback-1",
        auditId: "audit-1",
        rolledBackAt: "2026-07-20T17:00:00.000Z",
        status: "rolled_back",
        summary: {
          deletedItems: 1,
          deletedMedia: 1,
        },
        deleted: [
          {
            type: "media",
            omekaId: 9004,
            pnpuUuid: "01990f5a-0000-7000-8000-000000000902",
          },
          {
            type: "item",
            omekaId: 9003,
            pnpuUuid: "01990f5a-0000-7000-8000-000000000902",
          },
        ],
      });
      await expect(repository.list()).resolves.toMatchObject([
        { id: "audit-2" },
        { id: "audit-1" },
      ]);
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  it("returns an empty list when the audit directory does not exist", async () => {
    const repository = new FilePublicationImportAuditRepository(
      path.join(os.tmpdir(), "pnpu-import-audit-missing"),
    );

    await expect(repository.list()).resolves.toEqual([]);
    await expect(repository.get("missing")).resolves.toBeNull();
  });
});
