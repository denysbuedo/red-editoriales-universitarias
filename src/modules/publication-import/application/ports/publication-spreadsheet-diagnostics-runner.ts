import { PublicationImportDiagnosticsDto } from "../dtos/publication-import-diagnostics";

export interface PublicationSpreadsheetDiagnosticsRunner {
  diagnose(input: {
    readonly sourcePath: string;
    readonly sheet: string;
  }): Promise<PublicationImportDiagnosticsDto>;
}
