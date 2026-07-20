import { describe, expect, it, vi } from "vitest";

import {
  PublicationImportAuditEntryDto,
  PublicationImportAuditRepository,
  PublicationImportRollbackExecutor,
  PublicationImportRollbackPlanService,
  PublicationImportRollbackService,
  PublicationImportRollbackVerifier,
} from "@/modules/publication-import";

describe("PublicationImportRollbackService", () => {
  it("executes a clean rollback plan and records the rollback result", async () => {
    const rollbackResults: Parameters<PublicationImportAuditRepository["appendRollback"]>[0][] = [];
    const executeMock = vi.fn<PublicationImportRollbackExecutor["execute"]>().mockResolvedValue([
      {
        type: "media",
        omekaId: 9002,
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
      },
      {
        type: "item",
        omekaId: 9001,
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
      },
    ]);
    const repository = auditRepository(rollbackReadyAuditEntry(), (result) => {
      rollbackResults.push(result);
    });
    const service = new PublicationImportRollbackService(
      new PublicationImportRollbackPlanService(repository, verifier(), {
        importRoot: "Readme",
        now: () => new Date("2026-07-20T17:00:00.000Z"),
      }),
      { execute: executeMock },
      repository,
      () => new Date("2026-07-20T17:05:00.000Z"),
    );

    const result = await service.rollback({ auditId: "audit-1" });

    expect(result.rollbackId).toHaveLength(36);
    expect(result).toEqual({
      rollbackId: result.rollbackId,
      auditId: "audit-1",
      rolledBackAt: "2026-07-20T17:05:00.000Z",
      status: "rolled_back",
      summary: {
        deletedItems: 1,
        deletedMedia: 1,
      },
      deleted: [
        {
          type: "media",
          omekaId: 9002,
          pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
        },
        {
          type: "item",
          omekaId: 9001,
          pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
        },
      ],
    });
    expect(executeMock).toHaveBeenCalledWith([
      {
        type: "deleteDigitalResourceMedia",
        target: "Omeka S Media",
        omekaId: 9002,
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
      },
      {
        type: "deletePublicationItem",
        target: "Omeka S Item",
        omekaId: 9001,
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
      },
    ]);
    expect(rollbackResults).toEqual([result]);
  });

  it("does not execute when the rollback plan is blocked", async () => {
    const executeMock = vi.fn<PublicationImportRollbackExecutor["execute"]>();
    const repository = auditRepository({
      ...rollbackReadyAuditEntry(),
      created: [
        {
          row: 2,
          pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
          omekaItemId: 9001,
          omekaMediaId: 9002,
        },
      ],
    });
    const service = new PublicationImportRollbackService(
      new PublicationImportRollbackPlanService(repository, verifier(), { importRoot: "Readme" }),
      { execute: executeMock },
      repository,
    );

    await expect(service.rollback({ auditId: "audit-1" })).rejects.toMatchObject({
      code: "PNPU-422",
      message: "Publication import rollback plan is blocked.",
    });
    expect(executeMock).not.toHaveBeenCalled();
  });
});

function auditRepository(
  entry: PublicationImportAuditEntryDto,
  onRollback: (
    result: Parameters<PublicationImportAuditRepository["appendRollback"]>[0],
  ) => void = () => undefined,
): PublicationImportAuditRepository {
  return {
    append: () => Promise.resolve(),
    appendRollback: (result) => {
      onRollback(result);
      return Promise.resolve();
    },
    get: (id) => Promise.resolve(id === entry.id ? entry : null),
    list: () => Promise.resolve([entry]),
  };
}

function rollbackReadyAuditEntry(): PublicationImportAuditEntryDto {
  return {
    id: "audit-1",
    committedAt: "2026-07-20T15:00:00.000Z",
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
        row: 2,
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
        omekaItemId: 9001,
        omekaItemModified: "2026-07-20T15:00:01+00:00",
        omekaMediaId: 9002,
      },
    ],
  };
}

function verifier(): PublicationImportRollbackVerifier {
  return {
    verify: (resources) =>
      Promise.resolve(
        resources.map((resource) => ({
          row: resource.row,
          pnpuUuid: resource.pnpuUuid,
          omekaItemId: resource.omekaItemId,
          currentItemModified: resource.omekaItemModified,
          currentPnpuUuid: resource.pnpuUuid,
          itemExists: true,
          mediaExists: true,
          omekaMediaId: resource.omekaMediaId,
        })),
      ),
  };
}
