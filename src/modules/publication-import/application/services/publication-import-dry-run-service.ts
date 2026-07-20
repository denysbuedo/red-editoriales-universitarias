import {
  PublicationImportDryRunCandidateDto,
  PublicationImportDryRunDto,
  PublicationImportMappingPreviewRowDto,
} from "../dtos";
import {
  DiagnosePublicationImportCommand,
  PublicationImportDiagnosisServiceOptions,
} from "./publication-import-diagnosis-service";
import { PublicationImportMappingPreviewService } from "./publication-import-mapping-preview-service";

import { ApplicationError } from "@/modules/catalog/application";

export interface PublicationImportDryRunCommand extends DiagnosePublicationImportCommand {
  readonly enrichmentCsv: string;
}

interface EnrichmentRow {
  readonly row: number;
  readonly publisherAuthorityId: string;
  readonly controlledTypeOrGenre: string;
  readonly digitalResourceUrl: string;
  readonly language: string;
  readonly subjects: readonly string[];
  readonly license: string;
}

export class PublicationImportDryRunService {
  public constructor(
    private readonly mappingPreviewService: PublicationImportMappingPreviewService,
    private readonly options: PublicationImportDiagnosisServiceOptions,
  ) {}

  public async dryRun(
    command: PublicationImportDryRunCommand,
  ): Promise<PublicationImportDryRunDto> {
    const enrichmentRows = parseEnrichmentCsv(command.enrichmentCsv);
    const enrichmentByRow = new Map(enrichmentRows.map((row) => [row.row, row]));
    const preview = await this.mappingPreviewService.preview({
      sourcePath: command.sourcePath,
      sheet: command.sheet,
      maxRows: 10_000,
    });
    const candidates = preview.rows.map((row) => buildCandidate(row, enrichmentByRow.get(row.row)));

    return {
      source: preview.source,
      sheet: preview.sheet,
      generatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      summary: {
        totalRows: candidates.length,
        ready: candidates.filter((candidate) => candidate.decision === "ready").length,
        incomplete: candidates.filter((candidate) => candidate.decision === "incomplete").length,
        rejected: candidates.filter((candidate) => candidate.decision === "rejected").length,
        enrichmentRows: enrichmentRows.length,
      },
      candidates,
      preview,
    };
  }
}

function buildCandidate(
  row: PublicationImportMappingPreviewRowDto,
  enrichment: EnrichmentRow | undefined,
): PublicationImportDryRunCandidateDto {
  if (row.decision === "rejected") {
    return {
      row: row.row,
      title: row.title,
      isbn: row.normalizedIsbn,
      publisher: row.publisher,
      publisherAuthorityId: enrichment?.publisherAuthorityId ?? "",
      typeOrGenre: enrichment?.controlledTypeOrGenre ?? "",
      formats: row.formats,
      digitalResourceUrl: enrichment?.digitalResourceUrl ?? "",
      language: enrichment?.language ?? "",
      subjects: enrichment?.subjects ?? [],
      license: enrichment?.license ?? "",
      decision: "rejected",
      reasons: row.reasons,
    };
  }

  const reasons = missingEnrichmentReasons(enrichment);

  return {
    row: row.row,
    title: row.title,
    isbn: row.normalizedIsbn,
    publisher: row.publisher,
    publisherAuthorityId: enrichment?.publisherAuthorityId ?? "",
    typeOrGenre: enrichment?.controlledTypeOrGenre ?? "",
    formats: row.formats,
    digitalResourceUrl: enrichment?.digitalResourceUrl ?? "",
    language: enrichment?.language ?? "",
    subjects: enrichment?.subjects ?? [],
    license: enrichment?.license ?? "",
    decision: reasons.length === 0 ? "ready" : "incomplete",
    reasons,
  };
}

function missingEnrichmentReasons(enrichment: EnrichmentRow | undefined): readonly string[] {
  if (enrichment === undefined) {
    return ["No se encontro fila de enriquecimiento."];
  }

  const reasons: string[] = [];
  appendMissing(reasons, "publisherAuthorityId", enrichment.publisherAuthorityId);
  appendMissing(reasons, "controlledTypeOrGenre", enrichment.controlledTypeOrGenre);
  appendMissing(reasons, "digitalResourceUrl", enrichment.digitalResourceUrl);
  appendMissing(reasons, "language", enrichment.language);
  appendMissing(reasons, "subjects", enrichment.subjects.join("|"));
  appendMissing(reasons, "license", enrichment.license);

  return reasons;
}

function appendMissing(reasons: string[], field: string, value: string): void {
  if (value.trim().length === 0) {
    reasons.push(`Campo de enriquecimiento requerido: ${field}.`);
  }
}

function parseEnrichmentCsv(csv: string): readonly EnrichmentRow[] {
  if (csv.trim().length === 0) {
    throw ApplicationError.validation("Publication import enrichmentCsv is required.");
  }

  const [header, ...rows] = parseCsv(csv);
  const columnByName = new Map(header.map((name, index) => [name.trim(), index]));
  const requiredColumns = [
    "row",
    "publisherAuthorityId",
    "controlledTypeOrGenre",
    "digitalResourceUrl",
    "language",
    "subjects",
    "license",
  ];

  for (const column of requiredColumns) {
    if (!columnByName.has(column)) {
      throw ApplicationError.validation(
        `Publication import enrichmentCsv missing column: ${column}.`,
      );
    }
  }

  return rows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const rowNumber = Number(readCsvCell(row, columnByName, "row"));
      if (!Number.isInteger(rowNumber) || rowNumber < 1) {
        throw ApplicationError.validation(
          "Publication import enrichmentCsv has invalid row value.",
        );
      }

      return {
        row: rowNumber,
        publisherAuthorityId: readCsvCell(row, columnByName, "publisherAuthorityId"),
        controlledTypeOrGenre: readCsvCell(row, columnByName, "controlledTypeOrGenre"),
        digitalResourceUrl: readCsvCell(row, columnByName, "digitalResourceUrl"),
        language: readCsvCell(row, columnByName, "language"),
        subjects: readCsvCell(row, columnByName, "subjects")
          .split("|")
          .map((subject) => subject.trim())
          .filter(Boolean),
        license: readCsvCell(row, columnByName, "license"),
      };
    });
}

function readCsvCell(
  row: readonly string[],
  columnByName: ReadonlyMap<string, number>,
  column: string,
): string {
  const index = columnByName.get(column);
  return index === undefined ? "" : (row[index] ?? "").trim();
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  rows.push(row);

  return rows;
}
