import type { Metadata } from "next";
import Link from "next/link";

import { PublisherDetail, toPublisherDetail } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export const metadata: Metadata = {
  title: "Editoriales | PNPU",
  description: "Directorio público de editoriales universitarias integradas en la PNPU.",
};

export const dynamic = "force-dynamic";

interface PublisherDirectoryItem extends PublisherDetail {
  readonly publicationCount: number;
}

export default async function PublishersPage() {
  const { publicationService, publisherService } = await createCatalogServices();
  const publishers = await publisherService.listPublishers({ page: 1, pageSize: 20 });
  const directoryItems = await Promise.all(
    publishers.data.map(async (publisher) => {
      const detail = toPublisherDetail(publisher);
      const publications = await publicationService.listPublications({
        page: 1,
        pageSize: 1,
        publisherId: detail.id,
      });

      return {
        ...detail,
        publicationCount: publications.pagination.total,
      };
    }),
  );
  const totalPublications = directoryItems.reduce(
    (total, publisher) => total + publisher.publicationCount,
    0,
  );
  const provinces = new Set(
    directoryItems.map((publisher) => publisher.province).filter((value) => value !== undefined),
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav className="flex flex-wrap gap-3 text-sm" aria-label="Breadcrumb">
          <Link className="font-medium text-blue-800 hover:text-blue-950" href="/">
            PNPU
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-medium text-slate-700">Editoriales</span>
        </nav>

        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-900">
            Directorio nacional
          </p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-slate-950 md:text-4xl">
                Editoriales universitarias
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
                Registro público de editoriales universitarias integradas en la PNPU, con acceso a
                sus publicaciones, colecciones, datos institucionales y canales de contacto.
              </p>
            </div>
            <dl className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-200 bg-white text-center shadow-sm">
              <Metric label="Editoriales" value={publishers.pagination.total} />
              <Metric label="Publicaciones" value={totalPublications} />
              <Metric label="Provincias" value={provinces.size} />
            </dl>
          </div>
        </header>

        <section className="mt-8" aria-label="Listado de editoriales">
          <div className="grid gap-4">
            {directoryItems.map((publisher) => (
              <PublisherDirectoryCard key={publisher.id} publisher={publisher} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function PublisherDirectoryCard({ publisher }: { readonly publisher: PublisherDirectoryItem }) {
  return (
    <article className="grid gap-5 rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal">
          {publisher.acronym === undefined ? null : (
            <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-900">
              {publisher.acronym}
            </span>
          )}
          {publisher.publisherCode === undefined ? null : (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
              {publisher.publisherCode}
            </span>
          )}
          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">
            {publisher.country}
          </span>
        </div>

        <h2 className="mt-3 text-xl font-semibold leading-snug text-slate-950">
          <Link className="hover:text-blue-900" href={`/editoriales/${publisher.id}`}>
            {publisher.officialName}
          </Link>
        </h2>

        {publisher.description === undefined ? null : (
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">{publisher.description}</p>
        )}

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <DescriptionPair label="Universidad" value={publisher.university.officialName} />
          <DescriptionPair label="Provincia" value={publisher.province ?? "No registrada"} />
          <DescriptionPair
            label="Contacto"
            value={publisher.contactPoint?.email ?? "No registrado"}
          />
        </dl>
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-slate-100 pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <div>
          <p className="text-3xl font-bold text-slate-950">{publisher.publicationCount}</p>
          <p className="mt-1 text-sm text-slate-600">
            publicación{publisher.publicationCount === 1 ? "" : "es"} integrada
            {publisher.publicationCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="grid gap-2">
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-950 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-900"
            href={`/editoriales/${publisher.id}`}
          >
            Ver ficha
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
            href={`/publicaciones?publisherId=${publisher.id}`}
          >
            Ver publicaciones
          </Link>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="border-r border-slate-200 px-3 py-4 last:border-r-0">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function DescriptionPair({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-slate-900">{value}</dd>
    </div>
  );
}
