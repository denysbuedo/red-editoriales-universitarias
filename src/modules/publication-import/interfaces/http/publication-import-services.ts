import path from "node:path";

import { PublicationImportDiagnosisService } from "../../application/services/publication-import-diagnosis-service";
import { PythonPublicationSpreadsheetDiagnosticsRunner } from "../../infrastructure";

export function createPublicationImportDiagnosisService(): PublicationImportDiagnosisService {
  const importRoot = path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.PNPU_PUBLICATION_IMPORT_ROOT ?? "Readme",
  );

  return new PublicationImportDiagnosisService(
    new PythonPublicationSpreadsheetDiagnosticsRunner(),
    {
      importRoot,
    },
  );
}
