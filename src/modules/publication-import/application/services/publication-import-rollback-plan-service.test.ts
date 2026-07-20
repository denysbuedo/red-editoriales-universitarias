import { describe, expect, it } from "vitest";

import {
  PublicationImportAuditEntryDto,
  PublicationImportAuditRepository,
  PublicationImportRollbackPlanService,
  PublicationImportRollbackVerifier,
} from "@/modules/publication-import";

describe("PublicationImportRollbackPlanService", () => {
  it("blocks rollback when the audit entry has no modification baseline", async () => {
    const service = new PublicationImportRollbackPlanService(
      auditRepository({
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
            omekaMediaId: 9002,
          },
        ],
      }),
      verifier(),
      {
        importRoot: "Readme",
        now: () => new Date("2026-07-20T17:00:00.000Z"),
      },
    );

    await expect(service.plan({ auditId: "audit-1" })).resolves.toMatchObject({
      auditId: "audit-1",
      status: "blocked",
      summary: {
        items: 1,
        media: 1,
        operations: 0,
        risks: 1,
      },
      risks: [
        {
          code: "missingModificationBaseline",
          omekaId: 9001,
          pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
        },
      ],
    });
  });

  it("plans media and item deletion when Omeka resources match the audit baseline", async () => {
    const service = new PublicationImportRollbackPlanService(
      auditRepository({
        id: "audit-2",
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
            omekaMediaModified: "2026-07-20T15:00:02+00:00",
          },
        ],
      }),
      verifier({
        currentItemModified: "2026-07-20T15:00:01+00:00",
        currentPnpuUuid: "01990f5a-0000-7000-8000-000000000901",
      }),
      {
        importRoot: "Readme",
        now: () => new Date("2026-07-20T17:00:00.000Z"),
      },
    );

    await expect(service.plan({ auditId: "audit-2" })).resolves.toMatchObject({
      auditId: "audit-2",
      status: "planned_not_executed",
      summary: {
        items: 1,
        media: 1,
        operations: 2,
        risks: 0,
      },
      operations: [
        {
          type: "deleteDigitalResourceMedia",
          target: "Omeka S Media",
          omekaId: 9002,
        },
        {
          type: "deletePublicationItem",
          target: "Omeka S Item",
          omekaId: 9001,
        },
      ],
    });
  });
});

function auditRepository(entry: PublicationImportAuditEntryDto): PublicationImportAuditRepository {
  return {
    append: () => Promise.resolve(),
    get: (id) => Promise.resolve(id === entry.id ? entry : null),
    list: () => Promise.resolve([entry]),
  };
}

function verifier(
  overrides: Partial<{
    readonly currentItemModified: string;
    readonly currentPnpuUuid: string;
  }> = {},
): PublicationImportRollbackVerifier {
  return {
    verify: (resources) =>
      Promise.resolve(
        resources.map((resource) => ({
          row: resource.row,
          pnpuUuid: resource.pnpuUuid,
          omekaItemId: resource.omekaItemId,
          currentItemModified: overrides.currentItemModified,
          currentPnpuUuid: overrides.currentPnpuUuid ?? resource.pnpuUuid,
          itemExists: true,
          mediaExists: true,
          omekaMediaId: resource.omekaMediaId,
        })),
      ),
  };
}
