import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  PublicationImportDiagnosticsDto,
  PublicationImportMappingPreviewService,
  PublicationSpreadsheetDiagnosticsRunner,
} from "@/modules/publication-import";

const diagnostics: PublicationImportDiagnosticsDto = {
  source: "source.xlsx",
  sheet: "EDUNIV",
  summary: {
    rowCount: 3,
    rowsWithRequiredSpreadsheetFields: 2,
    missingFieldCount: 1,
    invalidIsbnCount: 0,
    duplicateIsbnCount: 1,
    invalidPublicationDateCount: 0,
    missingPnpuEnrichmentFields: ["language"],
  },
  missingByField: { format: 1 },
  missingRows: [{ row: 4, isbn: "9789590000003", title: "Sin formato", missingFields: ["format"] }],
  invalidIsbnRows: [],
  duplicateIsbns: [
    {
      isbn: "9789590000003",
      count: 2,
      rows: [
        { row: 2, title: "Libro uno" },
        { row: 3, title: "Libro dos" },
      ],
    },
  ],
  publicationDateFormats: {
    empty: 0,
    yearOnly: 3,
    monthYear: 0,
    isoDate: 0,
    invalid: 0,
    invalidRows: [],
  },
  distinctValues: {},
  mappingAssessment: {
    canPublishDirectlyToPnpu: false,
    reason: "Missing enrichment.",
    recommendedNextStep: "Complete mapping.",
  },
  records: [
    {
      row: 2,
      isbn: "9789590000003",
      normalizedIsbn: "9789590000003",
      title: "Libro uno",
      primaryContributor: "Ana",
      publisher: "Editorial Universitaria",
      genreOrPublicationType: "Libro",
      format: "pdf",
      formats: ["pdf"],
      publicationDate: "2026",
      dateFormat: "yearOnly",
    },
    {
      row: 3,
      isbn: "9789590000003",
      normalizedIsbn: "9789590000003",
      title: "Libro dos",
      primaryContributor: "Ana",
      publisher: "Editorial Universitaria",
      genreOrPublicationType: "Libro",
      format: "pdf",
      formats: ["pdf"],
      publicationDate: "2026",
      dateFormat: "yearOnly",
    },
    {
      row: 4,
      isbn: "9789590000004",
      normalizedIsbn: "9789590000004",
      title: "Sin formato",
      primaryContributor: "Ana",
      publisher: "Editorial Universitaria",
      genreOrPublicationType: "Libro",
      format: "",
      formats: [],
      publicationDate: "2026",
      dateFormat: "yearOnly",
    },
  ],
};

describe("PublicationImportMappingPreviewService", () => {
  it("builds a conservative mapping preview from spreadsheet records", async () => {
    const diagnose = vi.fn().mockResolvedValue(diagnostics);
    const runner: PublicationSpreadsheetDiagnosticsRunner = { diagnose };
    const service = new PublicationImportMappingPreviewService(runner, {
      importRoot: path.resolve("Readme"),
      now: () => new Date("2026-07-19T21:00:00.000Z"),
    });

    const preview = await service.preview({
      sourcePath: "Listado.xlsx",
      maxRows: 2,
    });

    expect(diagnose).toHaveBeenCalledWith({
      sourcePath: path.resolve("Readme", "Listado.xlsx"),
      sheet: "EDUNIV",
      includeRecords: true,
    });
    expect(preview.summary).toEqual({
      totalRows: 3,
      mappable: 0,
      needsEnrichment: 0,
      rejected: 3,
    });
    expect(preview.rows).toHaveLength(2);
    expect(preview.rows[0]).toMatchObject({
      decision: "rejected",
      normalizedPublicationDate: "2026",
      reasons: ["ISBN duplicado en la planilla."],
    });
    expect(preview.unresolvedPublishers).toEqual(["Editorial Universitaria"]);
    expect(preview.formatsWithoutDigitalResource).toEqual(["pdf"]);
    expect(preview.diagnostics.records).toBeUndefined();
  });

  it("marks valid base rows as needing enrichment", async () => {
    const diagnose = vi.fn().mockResolvedValue({
      ...diagnostics,
      summary: {
        ...diagnostics.summary,
        rowCount: 1,
        missingFieldCount: 0,
        duplicateIsbnCount: 0,
      },
      duplicateIsbns: [],
      records: [diagnostics.records?.[0]],
    });
    const service = new PublicationImportMappingPreviewService(
      { diagnose },
      { importRoot: path.resolve("Readme") },
    );

    const preview = await service.preview({ sourcePath: "Listado.xlsx" });

    expect(preview.summary).toMatchObject({
      totalRows: 1,
      mappable: 0,
      needsEnrichment: 1,
      rejected: 0,
    });
    expect(preview.rows[0]?.missingPnpuFields).toContain("language");
  });
});
