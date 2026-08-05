import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { readPublicationImportAdminSessionSummary } from "@/modules/publication-import/interfaces/http/publication-import-admin-session";

import PublicationImportDiagnosisPage from "./page";
import { PublicationImportDiagnosisForm } from "./publication-import-diagnosis-form";

describe("PublicationImportDiagnosisPage", () => {
  it("renders the publication import diagnosis page", () => {
    const html = renderToStaticMarkup(<PublicationImportDiagnosisPage />);

    expect(html).toContain("Diagnóstico de publicaciones");
    expect(html).toContain("Revisión operativa de planillas XLSX");
  });

  it("reads the administrator session summary from the session token", () => {
    expect(
      readPublicationImportAdminSessionSummary(
        buildUnsignedJwt({
          email: "admin@example.edu",
          preferred_username: "admin-pnpu",
        }),
      ),
    ).toEqual({
      displayName: "admin-pnpu",
      email: "admin@example.edu",
    });
  });
});

describe("PublicationImportDiagnosisForm", () => {
  it("renders the initial diagnosis form", () => {
    const html = renderToStaticMarkup(<PublicationImportDiagnosisForm />);

    expect(html).toContain("Ejecutar revisión");
    expect(html).toContain("Listado_Libro_Publicados_EDUNIV.xlsx");
    expect(html).toContain("Token administrativo");
    expect(html).toContain("Preview mapeo");
    expect(html).toContain("Autoridades Omeka");
    expect(html).toContain("Historial de commits");
    expect(html).toContain("Plan de rollback");
    expect(html).toContain("Ejecutar rollback");
    expect(html).toContain("CSV enriquecido");
    expect(html).toContain("Dry-run enriquecido");
    expect(html).toContain("Paquete validado");
    expect(html).toContain("Plan de commit");
    expect(html).toContain("Escribir en Omeka");
  });
});

function buildUnsignedJwt(payload: Readonly<Record<string, string>>): string {
  return `${base64UrlEncode(JSON.stringify({ alg: "none" }))}.${base64UrlEncode(
    JSON.stringify(payload),
  )}.signature`;
}

function base64UrlEncode(value: string): string {
  let binary = "";

  for (const byte of new TextEncoder().encode(value)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}
