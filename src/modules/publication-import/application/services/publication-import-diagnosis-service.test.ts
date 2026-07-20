import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  PublicationImportDiagnosisService,
  PublicationImportDiagnosticsDto,
  PublicationSpreadsheetDiagnosticsRunner,
} from "@/modules/publication-import";

const diagnostics: PublicationImportDiagnosticsDto = {
  source: "source.xlsx",
  sheet: "EDUNIV",
  summary: {
    rowCount: 1,
    rowsWithRequiredSpreadsheetFields: 1,
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
    yearOnly: 1,
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
};

describe("PublicationImportDiagnosisService", () => {
  it("diagnoses a spreadsheet inside the configured import root", async () => {
    const diagnose = vi.fn().mockResolvedValue(diagnostics);
    const runner: PublicationSpreadsheetDiagnosticsRunner = {
      diagnose,
    };
    const service = new PublicationImportDiagnosisService(runner, {
      importRoot: path.resolve("Readme"),
      now: () => new Date("2026-07-19T20:10:00.000Z"),
      idGenerator: () => "import-batch-1",
    });

    const batch = await service.diagnose({
      sourcePath: "Listado_Libro_Publicados_EDUNIV.xlsx",
    });

    expect(diagnose).toHaveBeenCalledWith({
      sourcePath: path.resolve("Readme", "Listado_Libro_Publicados_EDUNIV.xlsx"),
      sheet: "EDUNIV",
    });
    expect(batch).toMatchObject({
      id: "import-batch-1",
      status: "ready_for_mapping",
      diagnosedAt: "2026-07-19T20:10:00.000Z",
    });
  });

  it("rejects path traversal attempts", async () => {
    const service = new PublicationImportDiagnosisService(
      {
        diagnose: vi.fn(),
      },
      { importRoot: path.resolve("Readme") },
    );

    await expect(service.diagnose({ sourcePath: "../secret.xlsx" })).rejects.toMatchObject({
      code: "PNPU-422",
    });
  });

  it("rejects unsupported file extensions", async () => {
    const service = new PublicationImportDiagnosisService(
      {
        diagnose: vi.fn(),
      },
      { importRoot: path.resolve("Readme") },
    );

    await expect(service.diagnose({ sourcePath: "Listado.csv" })).rejects.toMatchObject({
      code: "PNPU-422",
    });
  });
});
