import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { readPublicationImportAdminSessionSummary } from "@/modules/publication-import/interfaces/http/publication-import-admin-session";

import PublicationImportDiagnosisPage from "./page";
import { PublicationImportDiagnosisForm } from "./publication-import-diagnosis-form";

describe("PublicationImportDiagnosisPage", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({
      get: () => ({
        value: buildUnsignedJwt({
          email: "admin@example.edu",
          name: "Admin PNPU",
          preferred_username: "admin-pnpu",
        }),
      }),
    });
  });

  it("renders the publication import diagnosis page", async () => {
    const html = renderToStaticMarkup(await PublicationImportDiagnosisPage());

    expect(html).toContain("Diagnóstico de publicaciones");
    expect(html).toContain("Revisión operativa de planillas XLSX");
    expect(html).toContain("Sesión OIDC activa");
    expect(html).toContain("Admin PNPU");
    expect(html).toContain("admin@example.edu");
    expect(html).toContain("/api/admin/auth/logout");
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
