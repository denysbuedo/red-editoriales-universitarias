import { describe, expect, it } from "vitest";

import {
  PublicationImportBatch,
  PublicationImportDiagnosticsDto,
} from "@/modules/publication-import";

const baseDiagnostics: PublicationImportDiagnosticsDto = {
  source: "Readme/Listado.xlsx",
  sheet: "EDUNIV",
  summary: {
    rowCount: 10,
    rowsWithRequiredSpreadsheetFields: 10,
    missingFieldCount: 0,
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
    yearOnly: 10,
    monthYear: 0,
    isoDate: 0,
    invalid: 0,
    invalidRows: [],
  },
  distinctValues: {},
  mappingAssessment: {
    canPublishDirectlyToPnpu: false,
    reason: "Missing PNPU enrichment.",
    recommendedNextStep: "Complete mapping.",
  },
};

describe("PublicationImportBatch", () => {
  it("marks complete spreadsheets as ready for mapping when PNPU enrichment is pending", () => {
    const batch = PublicationImportBatch.fromDiagnostics(
      "batch-1",
      new Date("2026-07-19T20:00:00.000Z"),
      baseDiagnostics,
    );

    expect(batch.toSnapshot()).toMatchObject({
      id: "batch-1",
      status: "ready_for_mapping",
      diagnosedAt: "2026-07-19T20:00:00.000Z",
    });
  });

  it("marks duplicate ISBNs as needing correction", () => {
    const batch = PublicationImportBatch.fromDiagnostics(
      "batch-2",
      new Date("2026-07-19T20:00:00.000Z"),
      {
        ...baseDiagnostics,
        summary: {
          ...baseDiagnostics.summary,
          duplicateIsbnCount: 1,
        },
      },
    );

    expect(batch.toSnapshot().status).toBe("needs_correction");
  });

  it("rejects empty spreadsheets", () => {
    const batch = PublicationImportBatch.fromDiagnostics(
      "batch-3",
      new Date("2026-07-19T20:00:00.000Z"),
      {
        ...baseDiagnostics,
        summary: {
          ...baseDiagnostics.summary,
          rowCount: 0,
        },
      },
    );

    expect(batch.toSnapshot().status).toBe("rejected");
  });
});
