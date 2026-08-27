import type { Metadata } from "next";

import { AdminSectionNav } from "../../admin-section-nav";
import { PageHero } from "../../../page-hero";

import { PublicationImportDiagnosisForm } from "./publication-import-diagnosis-form";

export const metadata: Metadata = {
  title: "Diagnóstico de importación | PNPU",
  description: "Vista operativa para diagnosticar tablas XLSX de publicaciones universitarias.",
};

export default function PublicationImportDiagnosisPage() {
  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Control operativo de lotes XLSX antes de escribir en Omeka S."
        eyebrow="Importación"
        maxWidth="max-w-7xl"
        title="Carga y revisión de publicaciones"
      />
      <AdminSectionNav />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <PublicationImportDiagnosisForm />
      </div>
    </main>
  );
}
