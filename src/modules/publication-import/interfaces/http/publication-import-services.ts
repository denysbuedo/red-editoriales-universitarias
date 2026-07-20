import path from "node:path";

import { PublicationImportDiagnosisService } from "../../application/services/publication-import-diagnosis-service";
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

function readPublicationImportOptions(): { readonly importRoot: string } {
  const importRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.PNPU_PUBLICATION_IMPORT_ROOT ?? "Readme",
  );

  return { importRoot };
}
