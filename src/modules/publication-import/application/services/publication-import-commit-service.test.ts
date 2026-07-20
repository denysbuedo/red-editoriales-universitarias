import { describe, expect, it, vi } from "vitest";

import {
  PublicationImportCommitService,
  PublicationImportCommitWriter,
  PublicationImportDuplicateLookup,
  PublicationImportCommitPlanService,
} from "@/modules/publication-import";

describe("PublicationImportCommitService", () => {
  it("commits candidates after a clean commit plan", async () => {
    const commitMock = vi.fn().mockResolvedValue([
      {
        row: 2,
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
        omekaItemId: 9001,
        omekaMediaId: 9002,
      },
    ]);
    const writer: PublicationImportCommitWriter = {
      commit: commitMock,
    };
    const service = new PublicationImportCommitService(
      new PublicationImportCommitPlanService({ importRoot: "Readme" }, noDuplicates()),
      writer,
      {
        importRoot: "Readme",
        now: () => new Date("2026-07-20T15:00:00.000Z"),
      },
    );

    const result = await service.commit({
      packageJson: JSON.stringify(buildReadyPackage()),
    });

    expect(result).toEqual({
      generatedAt: "2026-07-20T15:00:00.000Z",
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
    });
    expect(commitMock).toHaveBeenCalledOnce();
  });

  it("does not write when the commit plan is blocked", async () => {
    const commitMock = vi.fn();
    const writer: PublicationImportCommitWriter = {
      commit: commitMock,
    };
    const service = new PublicationImportCommitService(
      new PublicationImportCommitPlanService(
        { importRoot: "Readme" },
        {
          findMatches: () =>
            Promise.resolve([
              {
                identifierType: "isbn",
                identifierValue: "9789590000997",
                publicationId: "01990f5a-0000-7000-8000-000000000205",
                title: "Existente",
              },
            ]),
        },
      ),
      writer,
      { importRoot: "Readme" },
    );

    await expect(
      service.commit({
        packageJson: JSON.stringify(buildReadyPackage()),
      }),
    ).rejects.toMatchObject({
      code: "PNPU-422",
      message: "Publication import commit plan is blocked.",
    });
    expect(commitMock).not.toHaveBeenCalled();
  });
});

function noDuplicates(): PublicationImportDuplicateLookup {
  return {
    findMatches: () => Promise.resolve([]),
  };
}

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
        pnpuUuid: "01990f5a-0000-7000-8000-000000000901",
        title: "Libro listo",
        isbn: "9789590000997",
        doi: "",
        publicationDate: "2026-07-19",
        publisher: "Editorial Universitaria",
        contributorAuthorityIds: ["01990f5a-0000-7000-8000-000000000201"],
        publisherAuthorityId: "01990f5a-0000-7000-8000-000000000203",
        typeOrGenre: "book",
        formats: ["pdf"],
        digitalResourceUrl: "https://example.edu/libro.pdf",
        language: "es",
        subjects: ["37.01"],
        license: "CC BY",
        decision: "ready",
        reasons: [],
      },
    ],
  };
}
