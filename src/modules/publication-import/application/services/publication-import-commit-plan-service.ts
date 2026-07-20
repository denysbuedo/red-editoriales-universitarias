import {
  PublicationImportCommitPlanDto,
  PublicationImportCommitPlanOperationDto,
  PublicationImportCommitPlanRiskDto,
  PublicationImportDryRunCandidateDto,
} from "../dtos";
import { PublicationImportDiagnosisServiceOptions } from "./publication-import-diagnosis-service";

import { ApplicationError } from "@/modules/catalog/application";

export interface PublicationImportCommitPlanCommand {
  readonly packageJson: string;
}

interface ReadyImportPackage {
  readonly manifest: {
    readonly source: string;
    readonly sheet: string;
    readonly status: string;
  };
  readonly candidates: readonly PublicationImportDryRunCandidateDto[];
}

export class PublicationImportCommitPlanService {
  public constructor(private readonly options: PublicationImportDiagnosisServiceOptions) {}

  public plan(command: PublicationImportCommitPlanCommand): PublicationImportCommitPlanDto {
    const importPackage = readReadyImportPackage(command.packageJson);
    const risks = buildPackageRisks(importPackage);
    const operations = buildOperations(importPackage, risks);

    return {
      generatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      source: importPackage.manifest.source,
      sheet: importPackage.manifest.sheet,
      status: risks.length === 0 ? "planned_not_executed" : "blocked",
      summary: {
        candidates: importPackage.candidates.length,
        operations: operations.length,
        risks: risks.length,
      },
      operations,
      risks,
    };
  }
}

function readReadyImportPackage(packageJson: string): ReadyImportPackage {
  if (packageJson.trim().length === 0) {
    throw ApplicationError.validation("Publication import packageJson is required.");
  }

  const parsed = parseJson(packageJson);

  if (!isRecord(parsed) || !isRecord(parsed.manifest) || !Array.isArray(parsed.candidates)) {
    throw ApplicationError.validation("Publication import packageJson has invalid structure.");
  }

  const source = readString(parsed.manifest.source);
  const sheet = readString(parsed.manifest.sheet);
  const status = readString(parsed.manifest.status);

  if (status !== "validated_not_imported") {
    throw ApplicationError.validation(
      "Publication import packageJson must have manifest.status validated_not_imported.",
    );
  }

  const candidates = parsed.candidates.map(readReadyCandidate);

  return {
    manifest: { source, sheet, status },
    candidates,
  };
}

function parseJson(packageJson: string): unknown {
  try {
    return JSON.parse(packageJson) as unknown;
  } catch {
    throw ApplicationError.validation("Publication import packageJson must be valid JSON.");
  }
}

function readReadyCandidate(candidate: unknown): PublicationImportDryRunCandidateDto {
  if (!isRecord(candidate)) {
    throw ApplicationError.validation("Publication import packageJson has invalid candidate.");
  }

  const decision = readString(candidate.decision);
  if (decision !== "ready") {
    throw ApplicationError.validation(
      "Publication import packageJson can only contain ready candidates.",
    );
  }

  return {
    row: readPositiveInteger(candidate.row),
    title: readString(candidate.title),
    isbn: readString(candidate.isbn),
    publisher: readString(candidate.publisher),
    publisherAuthorityId: readString(candidate.publisherAuthorityId),
    typeOrGenre: readString(candidate.typeOrGenre),
    formats: readStringArray(candidate.formats),
    digitalResourceUrl: readString(candidate.digitalResourceUrl),
    language: readString(candidate.language),
    subjects: readStringArray(candidate.subjects),
    license: readString(candidate.license),
    decision,
    reasons: readStringArray(candidate.reasons),
  };
}

function buildPackageRisks(
  importPackage: ReadyImportPackage,
): readonly PublicationImportCommitPlanRiskDto[] {
  const risks: PublicationImportCommitPlanRiskDto[] = [];
  const isbnRows = new Map<string, number[]>();

  for (const candidate of importPackage.candidates) {
    appendCandidateRisks(risks, candidate);

    if (candidate.isbn.trim().length > 0) {
      const rows = isbnRows.get(candidate.isbn) ?? [];
      rows.push(candidate.row);
      isbnRows.set(candidate.isbn, rows);
    }
  }

  for (const [isbn, rows] of isbnRows) {
    if (rows.length > 1) {
      risks.push({
        code: "duplicate_isbn",
        message: `ISBN duplicado dentro del paquete: ${isbn}; filas ${rows.join(", ")}.`,
      });
    }
  }

  return risks;
}

function appendCandidateRisks(
  risks: PublicationImportCommitPlanRiskDto[],
  candidate: PublicationImportDryRunCandidateDto,
): void {
  appendMissingRisk(risks, candidate.row, "missing_title", "Titulo requerido.", candidate.title);
  appendMissingRisk(risks, candidate.row, "missing_isbn", "ISBN requerido.", candidate.isbn);
  appendMissingRisk(
    risks,
    candidate.row,
    "missing_publisher_authority",
    "Editorial no resuelta contra autoridad.",
    candidate.publisherAuthorityId,
  );
  appendMissingRisk(
    risks,
    candidate.row,
    "missing_type_or_genre",
    "Tipo o genero controlado requerido.",
    candidate.typeOrGenre,
  );
  appendMissingRisk(
    risks,
    candidate.row,
    "missing_digital_resource_url",
    "URL de recurso digital requerida.",
    candidate.digitalResourceUrl,
  );
  appendMissingRisk(
    risks,
    candidate.row,
    "missing_language",
    "Idioma requerido.",
    candidate.language,
  );
  appendMissingRisk(
    risks,
    candidate.row,
    "missing_license",
    "Licencia requerida.",
    candidate.license,
  );

  if (candidate.subjects.length === 0) {
    risks.push({
      row: candidate.row,
      code: "missing_subjects",
      message: "Materias controladas requeridas.",
    });
  }
}

function appendMissingRisk(
  risks: PublicationImportCommitPlanRiskDto[],
  row: number,
  code: string,
  message: string,
  value: string,
): void {
  if (value.trim().length === 0) {
    risks.push({ row, code, message });
  }
}

function buildOperations(
  importPackage: ReadyImportPackage,
  risks: readonly PublicationImportCommitPlanRiskDto[],
): readonly PublicationImportCommitPlanOperationDto[] {
  const riskyRows = new Set(
    risks.map((risk) => risk.row).filter((row): row is number => row !== undefined),
  );
  const operations = importPackage.candidates
    .filter((candidate) => !riskyRows.has(candidate.row))
    .flatMap(buildCandidateOperations);

  if (risks.length === 0) {
    operations.push({
      type: "recordBatchAudit",
      target: importPackage.manifest.source,
      payload: {
        source: importPackage.manifest.source,
        sheet: importPackage.manifest.sheet,
        candidateCount: String(importPackage.candidates.length),
      },
    });
  }

  return operations;
}

function buildCandidateOperations(
  candidate: PublicationImportDryRunCandidateDto,
): readonly PublicationImportCommitPlanOperationDto[] {
  const target = candidate.isbn || candidate.title;

  return [
    {
      type: "createPublicationItem",
      row: candidate.row,
      target,
      payload: {
        title: candidate.title,
        isbn: candidate.isbn,
        language: candidate.language,
        license: candidate.license,
        typeOrGenre: candidate.typeOrGenre,
      },
    },
    {
      type: "linkPublisher",
      row: candidate.row,
      target,
      payload: {
        publisherAuthorityId: candidate.publisherAuthorityId,
        publisherLabel: candidate.publisher,
      },
    },
    {
      type: "linkSubjects",
      row: candidate.row,
      target,
      payload: {
        subjects: candidate.subjects,
      },
    },
    {
      type: "attachDigitalResource",
      row: candidate.row,
      target,
      payload: {
        url: candidate.digitalResourceUrl,
        formats: candidate.formats,
      },
    },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(readString).filter(Boolean);
}

function readPositiveInteger(value: unknown): number {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 1) {
    throw ApplicationError.validation("Publication import packageJson has invalid row value.");
  }

  return numberValue;
}
