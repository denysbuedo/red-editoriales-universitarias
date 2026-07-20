import path from "node:path";

import {
  PublicationImportBatch,
  PublicationImportBatchSnapshot,
} from "../../domain/entities/publication-import-batch";
import { PublicationSpreadsheetDiagnosticsRunner } from "../ports/publication-spreadsheet-diagnostics-runner";

import { ApplicationError } from "@/modules/catalog/application";

export interface DiagnosePublicationImportCommand {
  readonly sourcePath: string;
  readonly sheet?: string;
}

export interface PublicationImportDiagnosisServiceOptions {
  readonly importRoot: string;
  readonly now?: () => Date;
  readonly idGenerator?: () => string;
}

export class PublicationImportDiagnosisService {
  public constructor(
    private readonly runner: PublicationSpreadsheetDiagnosticsRunner,
    private readonly options: PublicationImportDiagnosisServiceOptions,
  ) {}

  public async diagnose(
    command: DiagnosePublicationImportCommand,
  ): Promise<PublicationImportBatchSnapshot> {
    const sheet = normalizeSheet(command.sheet);
    const sourcePath = resolveAllowedPublicationImportSourcePath(
      command.sourcePath,
      this.options.importRoot,
    );
    const diagnostics = await this.runner.diagnose({ sourcePath, sheet });
    const batch = PublicationImportBatch.fromDiagnostics(
      this.options.idGenerator?.() ?? crypto.randomUUID(),
      this.options.now?.() ?? new Date(),
      diagnostics,
    );

    return batch.toSnapshot();
  }
}

export function resolveAllowedPublicationImportSourcePath(
  sourcePath: string,
  importRootPath: string,
): string {
  const normalizedSourcePath = sourcePath.trim();

  if (normalizedSourcePath.length === 0) {
    throw ApplicationError.validation("Publication import sourcePath is required.");
  }

  if (path.isAbsolute(normalizedSourcePath)) {
    throw ApplicationError.validation("Publication import sourcePath must be relative.");
  }

  if (path.extname(normalizedSourcePath).toLowerCase() !== ".xlsx") {
    throw ApplicationError.validation(
      "Publication import sourcePath must reference an .xlsx file.",
    );
  }

  const importRoot = path.resolve(importRootPath);
  const candidate = path.resolve(importRoot, normalizedSourcePath);
  const relativePath = path.relative(importRoot, candidate);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw ApplicationError.validation("Publication import sourcePath is outside the allowed root.");
  }

  return candidate;
}

export function normalizePublicationImportSheet(sheet: string | undefined): string {
  const normalizedSheet = sheet?.trim();

  if (normalizedSheet === undefined || normalizedSheet.length === 0) {
    return "EDUNIV";
  }

  if (!/^[\p{L}\p{N} _.-]{1,64}$/u.test(normalizedSheet)) {
    throw ApplicationError.validation("Publication import sheet has invalid characters.");
  }

  return normalizedSheet;
}

const normalizeSheet = normalizePublicationImportSheet;
