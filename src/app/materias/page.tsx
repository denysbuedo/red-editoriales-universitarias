import type { Metadata } from "next";
import Link from "next/link";

import { toSubjectAuthoritySummary } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

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
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
        PNPU
      </Link>
      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">Taxonomía</p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950 md:text-4xl">
          Materias del catálogo
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Vocabulario público de materias utilizado para clasificar publicaciones universitarias.
        </p>
      </header>

      <section className="mt-8" aria-label="Listado de materias">
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((subject) => (
            <article
              className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
              key={subject.identifier}
            >
              <p className="break-all text-sm text-neutral-600">{subject.identifier}</p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                <Link
                  className="hover:text-green-800"
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
                <p className="mt-2 break-all text-sm text-green-800">{subject.uri}</p>
              )}
              <Link
                className="mt-3 mr-2 inline-flex rounded-md border border-neutral-300 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                href={`/publicaciones?subject=${encodeURIComponent(subject.identifier)}`}
              >
                Ver publicaciones
              </Link>
              <Link
                className="mt-3 inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
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
