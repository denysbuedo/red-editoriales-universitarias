import { existsSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { PythonPublicationSpreadsheetDiagnosticsRunner } from "./python-publication-spreadsheet-diagnostics-runner";

describe("PythonPublicationSpreadsheetDiagnosticsRunner", () => {
  it("reads spreadsheet diagnostics as UTF-8 on Windows", async () => {
    const fixturePath = path.resolve("Readme", "Listado_Libro_Publicados_EDUNIV.xlsx");
    if (!existsSync(fixturePath)) {
      return;
    }

    const runner = new PythonPublicationSpreadsheetDiagnosticsRunner();
    const diagnostics = await runner.diagnose({
      sourcePath: fixturePath,
      sheet: "EDUNIV",
      includeRecords: true,
    });

    expect(diagnostics.records?.[1]?.title).toContain("Manual práctico");
    expect(diagnostics.records?.[1]?.title).toContain("¿cómo");
    expect(diagnostics.records?.[1]?.title).toContain("electrónico");
  });
});
