import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { PublicationImportDiagnosticsDto } from "../application/dtos/publication-import-diagnostics";
import { PublicationSpreadsheetDiagnosticsRunner } from "../application/ports/publication-spreadsheet-diagnostics-runner";

import { ApplicationError } from "@/modules/catalog/application";

const execFileAsync = promisify(execFile);

export class PythonPublicationSpreadsheetDiagnosticsRunner implements PublicationSpreadsheetDiagnosticsRunner {
  public async diagnose(input: {
    readonly sourcePath: string;
    readonly sheet: string;
  }): Promise<PublicationImportDiagnosticsDto> {
    const scriptPath = path.resolve("scripts", "check-publication-spreadsheet.py");
    const args = [scriptPath, input.sourcePath, "--sheet", input.sheet, "--json"];

    try {
      const result = await execFileAsync("python", args, {
        cwd: process.cwd(),
        windowsHide: true,
        timeout: 30_000,
      });

      return parseDiagnostics(result.stdout);
    } catch (error) {
      const stdout = readProcessStdout(error);
      if (stdout.trim().length > 0) {
        return parseDiagnostics(stdout);
      }

      throw ApplicationError.serviceUnavailable("Publication import diagnostics failed.");
    }
  }
}

function parseDiagnostics(stdout: string): PublicationImportDiagnosticsDto {
  try {
    return JSON.parse(stdout) as PublicationImportDiagnosticsDto;
  } catch {
    throw ApplicationError.serviceUnavailable(
      "Publication import diagnostics returned invalid JSON.",
    );
  }
}

function readProcessStdout(error: unknown): string {
  if (typeof error === "object" && error !== null && "stdout" in error) {
    const stdout = (error as { readonly stdout?: unknown }).stdout;
    return typeof stdout === "string" ? stdout : "";
  }

  return "";
}
