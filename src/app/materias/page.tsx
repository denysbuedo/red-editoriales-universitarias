import type { Metadata } from "next";
import Link from "next/link";

import { toSubjectAuthoritySummary } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

import { PageHero } from "../page-hero";

export const metadata: Metadata = {
  title: "Materias | PNPU",
  description: "Taxonomía pública de materias utilizadas por el catálogo PNPU.",
};

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const { subjectService } = await createCatalogServices();
  const subjects = await subjectService.listSubjects({ page: 1, pageSize: 50 });
  const summaries = subjects.data.map((profile) =>
    toSubjectAuthoritySummary(profile.subject, profile.publications.length),
  );

  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Vocabulario público de materias utilizado para clasificar publicaciones universitarias."
        eyebrow="Taxonomía"
        title="Materias del catálogo"
      />

      <section className="mx-auto max-w-6xl px-6 py-8" aria-label="Listado de materias">
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((subject) => (
            <article
              className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
              key={subject.identifier}
            >
              <p className="break-all text-sm text-neutral-600">{subject.identifier}</p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                <Link
                  className="hover:text-blue-800"
                  href={`/materias/${encodeURIComponent(subject.identifier)}`}
                >
                  {subject.preferredLabel}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                {subject.publicationCount} publicación
                {subject.publicationCount === 1 ? "" : "es"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-neutral-700">
                {subject.broader === undefined ? null : (
                  <span className="rounded-md bg-neutral-100 px-2 py-1">
                    Superior: {subject.broader}
                  </span>
                )}
                {subject.related?.map((related) => (
                  <span className="rounded-md bg-neutral-100 px-2 py-1" key={related}>
                    Relacionada: {related}
                  </span>
                ))}
              </div>
              {subject.uri === undefined ? null : (
                <p className="mt-2 break-all text-sm text-blue-800">{subject.uri}</p>
              )}
              <Link
                className="mt-3 mr-2 inline-flex rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                href={`/publicaciones?subject=${encodeURIComponent(subject.identifier)}`}
              >
                Ver publicaciones
              </Link>
              <Link
                className="mt-3 inline-flex rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                href={`/materias/${encodeURIComponent(subject.identifier)}`}
              >
                Ver materia
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
