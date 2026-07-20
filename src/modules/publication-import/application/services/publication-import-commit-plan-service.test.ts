import { describe, expect, it } from "vitest";

import { PublicationImportCommitPlanService } from "@/modules/publication-import";

describe("PublicationImportCommitPlanService", () => {
  it("builds projected operations without writing to Omeka", () => {
    const service = new PublicationImportCommitPlanService({
      importRoot: "Readme",
      now: () => new Date("2026-07-19T23:00:00.000Z"),
    });

    const plan = service.plan({
      packageJson: JSON.stringify(buildPackage()),
    });

    expect(plan).toMatchObject({
      generatedAt: "2026-07-19T23:00:00.000Z",
      source: "source.xlsx",
      sheet: "EDUNIV",
      status: "planned_not_executed",
      summary: {
        candidates: 1,
        operations: 5,
        risks: 0,
      },
    });
    expect(plan.operations.map((operation) => operation.type)).toEqual([
      "createPublicationItem",
      "linkPublisher",
      "linkSubjects",
      "attachDigitalResource",
      "recordBatchAudit",
    ]);
  });

  it("blocks packages with duplicate ISBNs", () => {
    const service = new PublicationImportCommitPlanService({ importRoot: "Readme" });
    const firstCandidate = buildPackage().candidates[0];

    const plan = service.plan({
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

  it("rejects packages that were not produced as validated exports", () => {
    const service = new PublicationImportCommitPlanService({ importRoot: "Readme" });

    expect(() =>
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
    ).toThrow("Publication import packageJson must have manifest.status validated_not_imported.");
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
        title: "Libro listo",
        isbn: "9789590000003",
        publisher: "Editorial Universitaria",
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
