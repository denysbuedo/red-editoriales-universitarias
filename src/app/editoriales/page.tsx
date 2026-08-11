import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PublisherDetail, toPublisherDetail } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

import { PageHero } from "../page-hero";

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
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Registro público de editoriales universitarias integradas en la PNPU, con acceso a sus publicaciones, colecciones, datos institucionales y canales de contacto."
        eyebrow="Directorio nacional"
        title="Editoriales universitarias"
      />

      <section className="border-b border-slate-200 bg-white" aria-label="Resumen de editoriales">
        <div className="mx-auto max-w-6xl px-6 py-5">
          <dl className="grid gap-3 md:grid-cols-3">
            <Metric label="Editoriales" value={publishers.pagination.total} />
            <Metric label="Publicaciones" value={totalPublications} />
            <Metric label="Provincias" value={provinces.size} />
          </dl>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-8">
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
    <article className="grid gap-5 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md lg:grid-cols-[minmax(0,1fr)_230px]">
      <div className="min-w-0">
        <div className="grid gap-4 p-5 sm:grid-cols-[72px_minmax(0,1fr)]">
          <PublisherMark publisher={publisher} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-normal">
              {publisher.acronym === undefined ? null : (
                <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-900">
                  {publisher.acronym}
                </span>
              )}
              {publisher.publisherCode === undefined ? null : (
                <span className="rounded-md bg-sky-50 px-2 py-1 text-sky-900">
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
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
                {publisher.description}
              </p>
            )}
          </div>
        </div>

        <dl className="grid gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-3">
          <DescriptionPair label="Universidad" value={publisher.university.officialName} />
          <DescriptionPair label="Provincia" value={publisher.province ?? "No registrada"} />
          <DescriptionPair
            label="Contacto"
            value={publisher.contactPoint?.email ?? "No registrado"}
          />
        </dl>
      </div>

      <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-blue-50 p-5 lg:border-l lg:border-t-0">
        <div>
          <p className="text-4xl font-bold text-blue-950">{publisher.publicationCount}</p>
          <p className="mt-1 text-sm text-blue-900">
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
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <dt className="text-xs font-semibold uppercase tracking-normal text-slate-500">{label}</dt>
      <dd className="mt-1 text-3xl font-bold text-blue-950">{value}</dd>
    </div>
  );
}

function PublisherMark({ publisher }: { readonly publisher: PublisherDirectoryItem }) {
  if (publisher.logo !== undefined) {
    return (
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md border border-slate-200 bg-white p-2">
        <Image
          alt={`Logo de ${publisher.officialName}`}
          className="max-h-14 w-auto"
          height={56}
          unoptimized
          src={publisher.logo}
          width={56}
        />
      </div>
    );
  }

  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md bg-blue-950 text-lg font-bold text-white">
      {readInitials(publisher.officialName)}
    </div>
  );
}

function readInitials(value: string): string {
  return value
    .split(/\s+/u)
    .filter((part) => part.length > 3)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function DescriptionPair({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-slate-900">{value}</dd>
    </div>
  );
}
