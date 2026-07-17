import type { Metadata } from "next";
import Link from "next/link";

import { toPublisherSummary } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const metadata: Metadata = {
  title: "Editoriales | PNPU",
  description: "Directorio público de editoriales universitarias integradas en la PNPU.",
};

export const dynamic = "force-dynamic";

export default async function PublishersPage() {
  const { publicationService, publisherService } = await createCatalogServices();
  const publishers = await publisherService.listPublishers({ page: 1, pageSize: 20 });
  const summaries = await Promise.all(
    publishers.data.map(async (publisher) => {
      const summary = toPublisherSummary(publisher);
      const publications = await publicationService.listPublications({
        page: 1,
        pageSize: 1,
        publisherId: summary.id,
      });

      return {
        ...summary,
        publicationCount: publications.pagination.total,
      };
    }),
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
        PNPU
      </Link>
      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">Directorio</p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950 md:text-4xl">
          Editoriales universitarias
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Directorio inicial de editoriales universitarias integradas en la red nacional.
        </p>
      </header>

      <section className="mt-8" aria-label="Listado de editoriales">
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((publisher) => (
            <article
              className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
              key={publisher.id}
            >
              <p className="text-sm text-neutral-600">
                País: {publisher.country} · {publisher.publicationCount} publicación
                {publisher.publicationCount === 1 ? "" : "es"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                <Link className="hover:text-green-800" href={`/editoriales/${publisher.id}`}>
                  {publisher.officialName}
                </Link>
              </h2>
              {publisher.acronym === undefined ? null : (
                <p className="mt-2 text-sm font-medium text-neutral-700">
                  Sigla: {publisher.acronym}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-neutral-700">
                <Link
                  className="rounded-md bg-neutral-100 px-2 py-1 hover:bg-neutral-200"
                  href={`/publicaciones?publisherId=${publisher.id}`}
                >
                  Ver publicaciones
                </Link>
              </div>
              <Link
                className="mt-5 inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
                href={`/editoriales/${publisher.id}`}
              >
                Ver ficha
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
