import type { Metadata } from "next";

import { PublicationImportDiagnosisForm } from "./publication-import-diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnóstico de importación | PNPU",
  description: "Vista operativa para diagnosticar tablas XLSX de publicaciones universitarias.",
};

export default function PublicationImportDiagnosisPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-b border-neutral-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-normal text-blue-800">Importación</p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-950 md:text-3xl">
          Carga y revisión de publicaciones
        </h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-neutral-700 md:text-base">
          Control operativo de lotes XLSX antes de escribir en Omeka S.
        </p>
      </header>

      <PublicationImportDiagnosisForm />
    </main>
  );
}
