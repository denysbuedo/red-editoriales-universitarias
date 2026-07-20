import { PublicationImportDiagnosticsDto } from "../../application/dtos/publication-import-diagnostics";

export type PublicationImportBatchStatus =
  "diagnosed" | "needs_correction" | "ready_for_mapping" | "rejected";

export interface PublicationImportBatchSnapshot {
  readonly id: string;
  readonly source: string;
  readonly sheet: string;
  readonly status: PublicationImportBatchStatus;
  readonly diagnosedAt: string;
  readonly diagnostics: PublicationImportDiagnosticsDto;
}

export class PublicationImportBatch {
  private constructor(private readonly snapshot: PublicationImportBatchSnapshot) {}

  public static fromDiagnostics(
    id: string,
    diagnosedAt: Date,
    diagnostics: PublicationImportDiagnosticsDto,
  ): PublicationImportBatch {
    return new PublicationImportBatch({
      id,
      source: diagnostics.source,
      sheet: diagnostics.sheet,
      status: resolveImportBatchStatus(diagnostics),
      diagnosedAt: diagnosedAt.toISOString(),
      diagnostics,
    });
  }

  public toSnapshot(): PublicationImportBatchSnapshot {
    return this.snapshot;
  }
}

function resolveImportBatchStatus(
  diagnostics: PublicationImportDiagnosticsDto,
): PublicationImportBatchStatus {
  if (diagnostics.summary.rowCount === 0) {
    return "rejected";
  }

  if (
    diagnostics.summary.invalidIsbnCount > 0 ||
    diagnostics.summary.duplicateIsbnCount > 0 ||
    diagnostics.summary.invalidPublicationDateCount > 0 ||
    diagnostics.summary.missingFieldCount > 0
  ) {
    return "needs_correction";
  }

  if (!diagnostics.mappingAssessment.canPublishDirectlyToPnpu) {
    return "ready_for_mapping";
  }

  return "diagnosed";
}
