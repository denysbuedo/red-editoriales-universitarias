import { describe, expect, it } from "vitest";

import { PublicationImportAuditService } from "@/modules/publication-import";

describe("PublicationImportAuditService", () => {
  it("summarizes committed import audit entries", async () => {
    const service = new PublicationImportAuditService(
      {
        append: () => Promise.resolve(),
        list: () =>
          Promise.resolve([
            {
              id: "audit-2",
              committedAt: "2026-07-20T16:00:00.000Z",
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
                  row: 3,
                  pnpuUuid: "01990f5a-0000-7000-8000-000000000902",
                  omekaItemId: 9003,
                },
              ],
            },
            {
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
            },
          ]),
      },
      {
        importRoot: "Readme",
        now: () => new Date("2026-07-20T17:00:00.000Z"),
      },
    );

    const result = await service.list();

    expect(result).toEqual({
      generatedAt: "2026-07-20T17:00:00.000Z",
      summary: {
        entries: 2,
        createdItems: 2,
        createdMedia: 1,
      },
      entries: [
        {
          id: "audit-2",
          committedAt: "2026-07-20T16:00:00.000Z",
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
              row: 3,
              pnpuUuid: "01990f5a-0000-7000-8000-000000000902",
              omekaItemId: 9003,
            },
          ],
        },
        {
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
        },
      ],
    });
  });
});
