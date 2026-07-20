import { describe, expect, it } from "vitest";

import { PublicationImportCommitPlanService } from "@/modules/publication-import";

describe("PublicationImportCommitPlanService", () => {
  it("builds projected operations without writing to Omeka", async () => {
    const service = new PublicationImportCommitPlanService({
      importRoot: "Readme",
      now: () => new Date("2026-07-19T23:00:00.000Z"),
    });

    const plan = await service.plan({
      packageJson: JSON.stringify(buildPackage()),
    });

    expect(plan).toMatchObject({
      generatedAt: "2026-07-19T23:00:00.000Z",
      source: "source.xlsx",
      sheet: "EDUNIV",
      status: "planned_not_executed",
      summary: {
        candidates: 1,
        operations: 6,
        risks: 0,
      },
    });
    expect(plan.operations.map((operation) => operation.type)).toEqual([
      "createPublicationItem",
      "linkPublisher",
      "linkContributors",
      "linkSubjects",
      "attachDigitalResource",
      "recordBatchAudit",
    ]);
  });

  it("blocks packages with duplicate ISBNs", async () => {
    const service = new PublicationImportCommitPlanService({ importRoot: "Readme" });
    const firstCandidate = buildPackage().candidates[0];

    const plan = await service.plan({
      packageJson: JSON.stringify({
        manifest: buildPackage().manifest,
        candidates: [
          firstCandidate,
          {
            ...firstCandidate,
            row: 3,
            title: "Duplicado",
          },
        ],
      }),
    });

    expect(plan.status).toBe("blocked");
    expect(plan.risks).toContainEqual({
      code: "duplicate_isbn",
      message: "ISBN duplicado dentro del paquete: 9789590000003; filas 2, 3.",
    });
  });

  it("blocks packages with ISBNs that already exist in the active catalog", async () => {
    const service = new PublicationImportCommitPlanService(
      { importRoot: "Readme" },
      {
        findMatches: () =>
          Promise.resolve([
            {
              identifierType: "isbn",
              identifierValue: "9789590000003",
              publicationId: "01990f5a-0000-7000-8000-000000000205",
              title: "Libro existente",
            },
          ]),
      },
    );

    const plan = await service.plan({
      packageJson: JSON.stringify(buildPackage()),
    });

    expect(plan.status).toBe("blocked");
    expect(plan.operations).toHaveLength(0);
    expect(plan.risks).toContainEqual({
      row: 2,
      code: "existing_identifier_match",
      message:
        "Ya existe una publicacion en Omeka con ISBN 9789590000003: Libro existente (01990f5a-0000-7000-8000-000000000205).",
    });
  });

  it("blocks packages with DOIs that already exist in the active catalog", async () => {
    const service = new PublicationImportCommitPlanService(
      { importRoot: "Readme" },
      {
        findMatches: () =>
          Promise.resolve([
            {
              identifierType: "doi",
              identifierValue: "https://doi.org/10.1234/pnpu.universidad-desarrollo-local",
              publicationId: "01990f5a-0000-7000-8000-000000000405",
              title: "Universidad y desarrollo local",
            },
          ]),
      },
    );

    const plan = await service.plan({
      packageJson: JSON.stringify({
        manifest: buildPackage().manifest,
        candidates: [
          {
            ...buildPackage().candidates[0],
            doi: "https://doi.org/10.1234/pnpu.universidad-desarrollo-local",
          },
        ],
      }),
    });

    expect(plan.status).toBe("blocked");
    expect(plan.risks).toContainEqual({
      row: 2,
      code: "existing_identifier_match",
      message:
        "Ya existe una publicacion en Omeka con DOI https://doi.org/10.1234/pnpu.universidad-desarrollo-local: Universidad y desarrollo local (01990f5a-0000-7000-8000-000000000405).",
    });
  });

  it("rejects packages that were not produced as validated exports", async () => {
    const service = new PublicationImportCommitPlanService({ importRoot: "Readme" });

    await expect(
      service.plan({
        packageJson: JSON.stringify({
          manifest: {
            source: "source.xlsx",
            sheet: "EDUNIV",
            status: "draft",
          },
          candidates: [],
        }),
      }),
    ).rejects.toThrow(
      "Publication import packageJson must have manifest.status validated_not_imported.",
    );
  });
});

function buildPackage(): {
  readonly manifest: {
    readonly source: string;
    readonly sheet: string;
    readonly status: string;
  };
  readonly candidates: readonly Readonly<Record<string, unknown>>[];
} {
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
        isbn: "9789590000003",
        doi: "",
        publicationDate: "2026-07-19",
        publisher: "Editorial Universitaria",
        contributorAuthorityIds: ["contributor-1"],
        publisherAuthorityId: "publisher-1",
        typeOrGenre: "book",
        formats: ["pdf"],
        digitalResourceUrl: "https://example.edu/libro.pdf",
        language: "es",
        subjects: ["unesco:1203", "unesco:5802"],
        license: "CC BY",
        decision: "ready",
        reasons: [],
      },
    ],
  };
}
