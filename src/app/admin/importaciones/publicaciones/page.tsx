import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { PublicationImportDiagnosisForm } from "./publication-import-diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnóstico de importación | PNPU",
  description: "Vista operativa para diagnosticar tablas XLSX de publicaciones universitarias.",
};

interface AdminSessionSummary {
  readonly displayName: string;
  readonly email?: string;
}

interface AdminJwtPayload {
  readonly email?: unknown;
  readonly name?: unknown;
  readonly preferred_username?: unknown;
}

const ADMIN_SESSION_COOKIE = "pnpu_admin_session";

export default async function PublicationImportDiagnosisPage() {
  const cookieStore = await cookies();
  const session = readAdminSessionSummary(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <nav
        className="flex flex-wrap items-center justify-between gap-3"
        aria-label="Administración"
      >
        <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
          PNPU
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            className="inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            href="/api/admin/auth/logout"
          >
            Cerrar sesión
          </Link>
        </div>
      </nav>
      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          Importación
        </p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950 md:text-4xl">
          Diagnóstico de publicaciones
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Revisión operativa de planillas XLSX entregadas por editoriales antes de cualquier mapeo
          hacia Omeka S.
        </p>
        <AdminSessionPanel session={session} />
      </header>

      <PublicationImportDiagnosisForm />
    </main>
  );
}

function AdminSessionPanel({ session }: { readonly session: AdminSessionSummary | null }) {
  return (
    <section className="mt-6 rounded-md border border-green-200 bg-green-50 p-4">
      <p className="text-sm font-semibold text-green-950">Sesión OIDC activa</p>
      <p className="mt-1 text-sm text-green-900">
        {session === null ? "Usuario autenticado" : session.displayName}
        {session?.email ? ` · ${session.email}` : ""}
      </p>
    </section>
  );
}

export function readAdminSessionSummary(token: string | undefined): AdminSessionSummary | null {
  if (token === undefined || token.trim().length === 0) {
    return null;
  }

  const payload = readJwtPayload(token);

  if (payload === null) {
    return null;
  }

  const displayName =
    readStringClaim(payload.name) ??
    readStringClaim(payload.preferred_username) ??
    readStringClaim(payload.email);

  if (displayName === undefined) {
    return null;
  }

  return {
    displayName,
    email: readStringClaim(payload.email),
  };
}

function readJwtPayload(token: string): AdminJwtPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const payload = parts[1] ?? "";

  try {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as AdminJwtPayload;
  } catch {
    return null;
  }
}

function readStringClaim(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/gu, "+").replace(/_/gu, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
