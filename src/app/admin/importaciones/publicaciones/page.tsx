import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import {
  PUBLICATION_IMPORT_ADMIN_SESSION_COOKIE,
  PublicationImportAdminSessionSummary,
  readPublicationImportAdminSessionSummary,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-session";

import { PublicationImportDiagnosisForm } from "./publication-import-diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnóstico de importación | PNPU",
  description: "Vista operativa para diagnosticar tablas XLSX de publicaciones universitarias.",
};

export default async function PublicationImportDiagnosisPage() {
  const cookieStore = await cookies();
  const session = readPublicationImportAdminSessionSummary(
    cookieStore.get(PUBLICATION_IMPORT_ADMIN_SESSION_COOKIE)?.value,
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <nav
        className="flex flex-wrap items-center justify-between gap-3"
        aria-label="Administración"
      >
        <Link className="text-sm font-medium text-blue-800 hover:text-blue-950" href="/">
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
        <p className="text-sm font-semibold uppercase tracking-normal text-blue-800">Importación</p>
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

function AdminSessionPanel({
  session,
}: {
  readonly session: PublicationImportAdminSessionSummary | null;
}) {
  return (
    <section className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-950">Sesión OIDC activa</p>
      <p className="mt-1 text-sm text-blue-900">
        {session === null ? "Usuario autenticado" : session.displayName}
        {session?.email ? ` · ${session.email}` : ""}
      </p>
    </section>
  );
}
