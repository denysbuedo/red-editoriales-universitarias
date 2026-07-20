import {
  PublicationImportDiagnosticsDto,
  PublicationImportMappingPreviewDto,
  PublicationImportMappingPreviewRowDto,
  PublicationImportSpreadsheetRecordDto,
} from "../dtos";
import {
  DiagnosePublicationImportCommand,
  normalizePublicationImportSheet,
  PublicationImportDiagnosisServiceOptions,
  resolveAllowedPublicationImportSourcePath,
} from "./publication-import-diagnosis-service";
import { PublicationSpreadsheetDiagnosticsRunner } from "../ports/publication-spreadsheet-diagnostics-runner";

import { ApplicationError } from "@/modules/catalog/application";

const PNPU_ENRICHMENT_FIELDS = [
  "pnpuUuid",
  "language",
  "subjects",
  "license",
  "digitalResourceUrl",
  "publisherAuthorityId",
];

export class PublicationImportMappingPreviewService {
  public constructor(
    private readonly runner: PublicationSpreadsheetDiagnosticsRunner,
    private readonly options: PublicationImportDiagnosisServiceOptions,
  ) {}

  public async preview(
    command: DiagnosePublicationImportCommand & { readonly maxRows?: number },
  ): Promise<PublicationImportMappingPreviewDto> {
    const sourcePath = resolveAllowedPublicationImportSourcePath(
      command.sourcePath,
      this.options.importRoot,
    );
    const sheet = normalizePublicationImportSheet(command.sheet);
    const diagnostics = await this.runner.diagnose({
      sourcePath,
      sheet,
      includeRecords: true,
    });

    if (diagnostics.records === undefined) {
      throw ApplicationError.serviceUnavailable("Publication import records are unavailable.");
    }

    const rows = diagnostics.records.map((record) => mapRecordToPreviewRow(record, diagnostics));
    const limitedRows = rows.slice(0, command.maxRows ?? 50);

    return {
      source: diagnostics.source,
      sheet: diagnostics.sheet,
      generatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      summary: {
        totalRows: rows.length,
        mappable: rows.filter((row) => row.decision === "mappable").length,
        needsEnrichment: rows.filter((row) => row.decision === "needs_enrichment").length,
        rejected: rows.filter((row) => row.decision === "rejected").length,
      },
      unresolvedPublishers: distinctNonEmpty(rows.map((row) => row.publisher)),
      unresolvedGenresOrPublicationTypes: distinctNonEmpty(
        rows.map((row) => row.genreOrPublicationType),
      ),
      formatsWithoutDigitalResource: distinctNonEmpty(rows.flatMap((row) => row.formats)),
      rows: limitedRows,
      diagnostics: {
        ...diagnostics,
        records: undefined,
      },
    };
  }
}

function mapRecordToPreviewRow(
  record: PublicationImportSpreadsheetRecordDto,
  diagnostics: PublicationImportDiagnosticsDto,
): PublicationImportMappingPreviewRowDto {
  const reasons = buildRowReasons(record, diagnostics);
  const missingPnpuFields = reasons.length === 0 ? PNPU_ENRICHMENT_FIELDS : [];

  return {
    row: record.row,
    title: record.title,
    isbn: record.isbn,
    normalizedIsbn: record.normalizedIsbn,
    primaryContributor: record.primaryContributor,
    publisher: record.publisher,
    genreOrPublicationType: record.genreOrPublicationType,
    formats: record.formats,
    publicationDate: record.publicationDate,
    normalizedPublicationDate: normalizePublicationDate(record),
    decision: reasons.length > 0 ? "rejected" : "needs_enrichment",
    reasons: reasons.length > 0 ? reasons : ["Requiere enriquecimiento PNPU antes del mapeo."],
    missingPnpuFields,
  };
}

function buildRowReasons(
  record: PublicationImportSpreadsheetRecordDto,
  diagnostics: PublicationImportDiagnosticsDto,
): readonly string[] {
  const reasons: string[] = [];

  if (record.normalizedIsbn.length === 0) {
    reasons.push("ISBN requerido.");
  }

  for (const [field, value] of Object.entries({
    title: record.title,
    primaryContributor: record.primaryContributor,
    publisher: record.publisher,
    genreOrPublicationType: record.genreOrPublicationType,
    format: record.format,
    publicationDate: record.publicationDate,
  })) {
    if (value.trim().length === 0) {
      reasons.push(`Campo requerido vacio: ${field}.`);
    }
  }

  if (diagnostics.invalidIsbnRows.some((row) => row.row === record.row)) {
    reasons.push("ISBN invalido.");
  }

  if (
    diagnostics.duplicateIsbns.some((duplicate) =>
      duplicate.rows.some((row) => row.row === record.row),
    )
  ) {
    reasons.push("ISBN duplicado en la planilla.");
  }

  if (record.publicationDate.trim().length > 0 && record.dateFormat === undefined) {
    reasons.push("Fecha con formato no reconocido.");
  }

  return reasons;
}

function normalizePublicationDate(record: PublicationImportSpreadsheetRecordDto): string | null {
  if (record.dateFormat === "yearOnly") {
    return record.publicationDate;
  }

  if (record.dateFormat === "isoDate") {
    return record.publicationDate;
  }

  if (record.dateFormat === "monthYear") {
    const [month, year] = record.publicationDate.split(/[/. -]/u);
    return `${year}-${month.padStart(2, "0")}`;
  }

  return null;
}

function distinctNonEmpty(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}
