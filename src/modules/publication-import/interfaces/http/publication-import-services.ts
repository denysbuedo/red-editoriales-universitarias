import path from "node:path";

import { PublicationImportCommitPlanService } from "../../application/services/publication-import-commit-plan-service";
import { PublicationImportDiagnosisService } from "../../application/services/publication-import-diagnosis-service";
import { PublicationImportDryRunService } from "../../application/services/publication-import-dry-run-service";
import { PublicationImportMappingPreviewService } from "../../application/services/publication-import-mapping-preview-service";
import { PythonPublicationSpreadsheetDiagnosticsRunner } from "../../infrastructure";

export function createPublicationImportDiagnosisService(): PublicationImportDiagnosisService {
  return new PublicationImportDiagnosisService(
    new PythonPublicationSpreadsheetDiagnosticsRunner(),
    readPublicationImportOptions(),
  );
}

export function createPublicationImportMappingPreviewService(): PublicationImportMappingPreviewService {
  return new PublicationImportMappingPreviewService(
    new PythonPublicationSpreadsheetDiagnosticsRunner(),
    readPublicationImportOptions(),
  );
}

export function createPublicationImportDryRunService(): PublicationImportDryRunService {
  const options = readPublicationImportOptions();
  return new PublicationImportDryRunService(
    new PublicationImportMappingPreviewService(
      new PythonPublicationSpreadsheetDiagnosticsRunner(),
      options,
    ),
    options,
  );
}

export function createPublicationImportCommitPlanService(): PublicationImportCommitPlanService {
  return new PublicationImportCommitPlanService(readPublicationImportOptions());
}

function readPublicationImportOptions(): { readonly importRoot: string } {
  const importRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.PNPU_PUBLICATION_IMPORT_ROOT ?? "Readme",
  );

  return { importRoot };
}
