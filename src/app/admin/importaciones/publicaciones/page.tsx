import type { Metadata } from "next";
import Link from "next/link";

import { PublicationImportDiagnosisForm } from "./publication-import-diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnóstico de importación | PNPU",
  description: "Vista operativa para diagnosticar tablas XLSX de publicaciones universitarias.",
};

export default function PublicationImportDiagnosisPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
        PNPU
      </Link>
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
      </header>

      <PublicationImportDiagnosisForm />
    </main>
  );
}
