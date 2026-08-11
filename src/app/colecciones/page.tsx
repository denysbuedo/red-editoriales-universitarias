import type { Metadata } from "next";
import Link from "next/link";

import { toCollectionSummary } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

import { PageHero } from "../page-hero";

export const metadata: Metadata = {
  title: "Colecciones | PNPU",
  description: "Colecciones editoriales universitarias integradas en la PNPU.",
};

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const { collectionService } = await createCatalogServices();
  const collections = await collectionService.listCollections({ page: 1, pageSize: 20 });
  const summaries = collections.data.map((profile) =>
    toCollectionSummary(profile.collection, profile.publications.length),
  );

  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Series y colecciones editoriales universitarias organizadas dentro del catálogo nacional."
        eyebrow="Colecciones"
        title="Colecciones editoriales"
      />

      <section className="mx-auto max-w-6xl px-6 py-8" aria-label="Listado de colecciones">
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((collection) => (
            <article
              className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
              key={collection.id}
            >
              <p className="text-sm text-neutral-600">
                {collection.publicationCount} publicación
                {collection.publicationCount === 1 ? "" : "es"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                <Link className="hover:text-blue-800" href={`/colecciones/${collection.id}`}>
                  {collection.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                <Link
                  className="font-medium text-blue-800 hover:text-blue-950"
                  href={`/editoriales/${collection.publisher.id}`}
                >
                  {collection.publisher.officialName}
                </Link>
                {collection.editorialSeries === undefined ? "" : ` · ${collection.editorialSeries}`}
                {collection.collectionCode === undefined ? "" : ` · ${collection.collectionCode}`}
              </p>
              {collection.description === undefined ? null : (
                <p className="mt-2 text-sm leading-6 text-neutral-700">{collection.description}</p>
              )}
              {collection.subjects === undefined || collection.subjects.length === 0 ? null : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {collection.subjects.map((subject) => (
                    <Link
                      className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                      href={`/materias/${encodeURIComponent(subject.identifier)}`}
                      key={subject.identifier}
                    >
                      {subject.preferredLabel}
                    </Link>
                  ))}
                </div>
              )}
              <Link
                className="mt-5 inline-flex rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                href={`/colecciones/${collection.id}`}
              >
                Ver colección
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
