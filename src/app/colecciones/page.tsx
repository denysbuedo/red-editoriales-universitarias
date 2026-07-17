import type { Metadata } from "next";
import Link from "next/link";

import { toCollectionSummary } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const metadata: Metadata = {
  title: "Colecciones | PNPU",
  description: "Colecciones editoriales universitarias integradas en la PNPU.",
};

export default async function CollectionsPage() {
  const { collectionService } = await createCatalogServices();
  const collections = await collectionService.listCollections({ page: 1, pageSize: 20 });
  const summaries = collections.data.map((profile) =>
    toCollectionSummary(profile.collection, profile.publications.length),
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
        PNPU
      </Link>
      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          Colecciones
        </p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950 md:text-4xl">
          Colecciones editoriales
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Series y colecciones editoriales universitarias organizadas dentro del catálogo nacional.
        </p>
      </header>

      <section className="mt-8" aria-label="Listado de colecciones">
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
                <Link className="hover:text-green-800" href={`/colecciones/${collection.id}`}>
                  {collection.title}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-neutral-700">
                <Link
                  className="font-medium text-green-800 hover:text-green-950"
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
                className="mt-5 inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
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
