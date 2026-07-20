import { describe, expect, it, vi } from "vitest";

import {
  PublicationImportDryRunService,
  PublicationImportMappingPreviewDto,
  PublicationImportMappingPreviewService,
} from "@/modules/publication-import";

const preview: PublicationImportMappingPreviewDto = {
  source: "source.xlsx",
  sheet: "EDUNIV",
  generatedAt: "2026-07-19T22:00:00.000Z",
  summary: {
    totalRows: 3,
    mappable: 0,
    needsEnrichment: 2,
    rejected: 1,
  },
  unresolvedPublishers: ["Editorial Universitaria"],
  unresolvedGenresOrPublicationTypes: ["Libro"],
  formatsWithoutDigitalResource: ["pdf"],
  rows: [
    {
      row: 2,
      title: "Libro listo",
      isbn: "9789590000003",
      normalizedIsbn: "9789590000003",
      primaryContributor: "Ana",
      publisher: "Editorial Universitaria",
      genreOrPublicationType: "Libro",
      formats: ["pdf"],
      publicationDate: "2026",
      normalizedPublicationDate: "2026",
      decision: "needs_enrichment",
      reasons: ["Requiere enriquecimiento PNPU antes del mapeo."],
      missingPnpuFields: ["language"],
    },
    {
      row: 3,
      title: "Libro incompleto",
      isbn: "9789590000010",
      normalizedIsbn: "9789590000010",
      primaryContributor: "Ana",
      publisher: "Editorial Universitaria",
      genreOrPublicationType: "Libro",
      formats: ["pdf"],
      publicationDate: "2026",
      normalizedPublicationDate: "2026",
      decision: "needs_enrichment",
      reasons: ["Requiere enriquecimiento PNPU antes del mapeo."],
      missingPnpuFields: ["language"],
    },
    {
      row: 4,
      title: "Libro rechazado",
      isbn: "",
      normalizedIsbn: "",
      primaryContributor: "",
      publisher: "",
      genreOrPublicationType: "",
      formats: [],
      publicationDate: "",
      normalizedPublicationDate: null,
      decision: "rejected",
      reasons: ["ISBN requerido."],
      missingPnpuFields: [],
    },
  ],
  diagnostics: {
    source: "source.xlsx",
    sheet: "EDUNIV",
    summary: {
      rowCount: 3,
      rowsWithRequiredSpreadsheetFields: 2,
      missingFieldCount: 1,
      invalidIsbnCount: 0,
      duplicateIsbnCount: 0,
      invalidPublicationDateCount: 0,
      missingPnpuEnrichmentFields: ["language"],
    },
    missingByField: {},
    missingRows: [],
    invalidIsbnRows: [],
    duplicateIsbns: [],
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
      recommendedNextStep: "Map records.",
    },
  },
};

describe("PublicationImportDryRunService", () => {
  it("builds ready, incomplete and rejected candidates from enrichment CSV", async () => {
    const mappingPreviewService = {
      preview: vi.fn().mockResolvedValue(preview),
    } as unknown as PublicationImportMappingPreviewService;
    const service = new PublicationImportDryRunService(mappingPreviewService, {
      importRoot: "Readme",
      now: () => new Date("2026-07-19T22:30:00.000Z"),
    });

    const dryRun = await service.dryRun({
      sourcePath: "Listado.xlsx",
      enrichmentCsv: [
        "row,title,isbn,publisher,publisherAuthorityId,genreOrPublicationType,controlledTypeOrGenre,formats,digitalResourceUrl,language,subjects,license,notes",
        "2,Libro listo,9789590000003,Editorial Universitaria,publisher-1,Libro,book,pdf,https://example.edu/libro.pdf,es,unesco:1203|unesco:5802,CC BY,",
        "3,Libro incompleto,9789590000010,Editorial Universitaria,publisher-1,Libro,book,pdf,,es,unesco:1203,CC BY,",
      ].join("\n"),
    });

    expect(dryRun.summary).toEqual({
      totalRows: 3,
      ready: 1,
      incomplete: 1,
      rejected: 1,
      enrichmentRows: 2,
    });
    expect(dryRun.candidates[0]).toMatchObject({
      decision: "ready",
      language: "es",
      subjects: ["unesco:1203", "unesco:5802"],
    });
    expect(dryRun.candidates[1]).toMatchObject({
      decision: "incomplete",
      reasons: ["Campo de enriquecimiento requerido: digitalResourceUrl."],
    });
    expect(dryRun.candidates[2]).toMatchObject({
      decision: "rejected",
      reasons: ["ISBN requerido."],
    });
  });
});
