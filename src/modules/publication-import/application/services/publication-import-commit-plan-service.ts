import {
  PublicationImportCommitPlanDto,
  PublicationImportCommitPlanOperationDto,
  PublicationImportCommitPlanRiskDto,
  PublicationImportDryRunCandidateDto,
} from "../dtos";
import { PublicationImportDuplicateLookup } from "../ports/publication-import-duplicate-lookup";
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
  public constructor(
    private readonly options: PublicationImportDiagnosisServiceOptions,
    private readonly duplicateLookup?: PublicationImportDuplicateLookup,
  ) {}

  public async plan(
    command: PublicationImportCommitPlanCommand,
  ): Promise<PublicationImportCommitPlanDto> {
    const importPackage = readReadyImportPackage(command.packageJson);
    const risks = [
      ...buildPackageRisks(importPackage),
      ...(await this.buildExistingPublicationRisks(importPackage)),
    ];
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

  private async buildExistingPublicationRisks(
    importPackage: ReadyImportPackage,
  ): Promise<readonly PublicationImportCommitPlanRiskDto[]> {
    if (this.duplicateLookup === undefined) {
      return [];
    }

    const matches = await this.duplicateLookup.findMatches(
      importPackage.candidates.flatMap((candidate) => [
        ...(candidate.isbn.trim().length > 0
          ? [{ type: "isbn" as const, value: candidate.isbn }]
          : []),
        ...(candidate.doi !== undefined && candidate.doi.trim().length > 0
          ? [{ type: "doi" as const, value: candidate.doi }]
          : []),
      ]),
    );
    const matchesByIdentifier = new Map(
      matches.map((match) => [
        buildIdentifierKey(match.identifierType, match.identifierValue),
        match,
      ]),
    );

    return importPackage.candidates
      .map((candidate): PublicationImportCommitPlanRiskDto | null => {
        const match =
          matchesByIdentifier.get(buildIdentifierKey("isbn", candidate.isbn)) ??
          (candidate.doi === undefined
            ? undefined
            : matchesByIdentifier.get(buildIdentifierKey("doi", candidate.doi)));

        if (match === undefined) {
          return null;
        }

        return {
          row: candidate.row,
          code: "existing_identifier_match",
          message: `Ya existe una publicacion en Omeka con ${match.identifierType.toUpperCase()} ${match.identifierValue}: ${match.title} (${match.publicationId}).`,
        };
      })
      .filter(isCommitPlanRisk);
  }
}

function isCommitPlanRisk(
  risk: PublicationImportCommitPlanRiskDto | null,
): risk is PublicationImportCommitPlanRiskDto {
  return risk !== null;
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
    doi: readOptionalString(candidate.doi),
    publisher: readString(candidate.publisher),
    publicationDate: readString(candidate.publicationDate),
    contributorAuthorityIds: readStringArray(candidate.contributorAuthorityIds),
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
    "missing_publication_date",
    "Fecha de publicacion ISO completa requerida.",
    candidate.publicationDate,
  );
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate.publicationDate)) {
    risks.push({
      row: candidate.row,
      code: "invalid_publication_date",
      message: "Fecha de publicacion debe usar formato YYYY-MM-DD.",
    });
  }
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

  if (candidate.contributorAuthorityIds.length === 0) {
    risks.push({
      row: candidate.row,
      code: "missing_contributor_authority",
      message: "Autoridad de contribuyente requerida para dcterms:creator.",
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
        doi: candidate.doi ?? "",
        publicationDate: candidate.publicationDate,
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
      type: "linkContributors",
      row: candidate.row,
      target,
      payload: {
        contributorAuthorityIds: candidate.contributorAuthorityIds,
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

function readOptionalString(value: unknown): string | undefined {
  const normalizedValue = readString(value);

  return normalizedValue.length === 0 ? undefined : normalizedValue;
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

function buildIdentifierKey(type: string, value: string): string {
  return `${type}:${value.trim().toLowerCase()}`;
}
