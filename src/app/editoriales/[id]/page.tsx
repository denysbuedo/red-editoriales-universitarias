import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ApplicationError,
  CollectionSummary,
  PublicationSummary,
  PublisherDetail,
  toCollectionSummary,
  toPublicationSummary,
  toPublisherDetail,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { JsonLdObject, JsonLdScript } from "@/shared/seo/json-ld";

import { PageHero } from "../../page-hero";

interface PublisherPageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: PublisherPageProps): Promise<Metadata> {
  const { id } = await params;
  const publisher = await getPublisherDetailOrNull(id);
  const canonicalUrl = buildPublisherUrl(id);

  if (publisher === null) {
    return {
      title: "Editorial no encontrada | PNPU",
    };
  }

  return {
    title: `${publisher.officialName} | PNPU`,
    description: publisher.description ?? `Ficha pública de ${publisher.officialName}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: publisher.officialName,
      description: publisher.description ?? `Ficha pública de ${publisher.officialName}.`,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function PublisherDetailPage({ params }: PublisherPageProps) {
  const { id } = await params;
  const profile = await getPublisherProfileOrNull(id);

  if (profile === null) {
    notFound();
  }

  const { collections, publicationCount, publications, publisher } = profile;

  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <JsonLdScript
        data={buildPublisherJsonLd(publisher, buildPublisherUrl(publisher.id))}
        id="publisher-jsonld"
      />

      <PageHero
        description={publisher.description ?? `Ficha pública de ${publisher.officialName}.`}
        eyebrow="Editorial universitaria"
        title={publisher.officialName}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <article>
          <dl className="grid gap-3 md:grid-cols-3">
            <Metric label="Publicaciones" value={publicationCount} />
            <Metric label="Colecciones" value={collections.length} />
            <Metric label="Materias" value={countSubjects(publications)} />
          </dl>

          <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="border-l-4 border-blue-900 bg-white px-4 py-4 sm:px-5">
                <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">
                  Datos institucionales
                </h2>
              </div>
              <div className="border-t border-slate-100 px-4 pb-5 sm:px-5">
                <dl className="mt-5 grid gap-4 md:grid-cols-2">
                  <DescriptionPair
                    label="Entidad responsable"
                    value={formatResponsibleEntity(publisher)}
                  />
                  <DescriptionPair
                    label="Ubicación"
                    value={publisher.province ?? publisher.university.province ?? "No registrada"}
                  />
                  <DescriptionPair label="País" value={publisher.country} />
                </dl>
              </div>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
              <div className="border-l-4 border-sky-500 bg-white px-4 py-4 sm:px-5">
                <h2 className="text-lg font-semibold text-slate-950 sm:text-xl">
                  Contacto y enlaces
                </h2>
              </div>
              <div className="border-t border-slate-100 px-4 pb-5 sm:px-5">
                <dl className="mt-5 grid gap-4 text-sm">
                  <EmailPair label="Correo de contacto" value={publisher.contactPoint?.email} />
                  <DescriptionPair
                    label="Teléfono"
                    value={publisher.contactPoint?.telephone ?? "No registrado"}
                  />
                  <LinkPair label="Sitio web" value={publisher.website} />
                  <LinkPair label="Contacto institucional" value={publisher.contactPoint?.url} />
                  <OrganizationPair publisher={publisher} />
                </dl>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Publicaciones</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {publicationCount} publicación{publicationCount === 1 ? "" : "es"} asociada
                  {publicationCount === 1 ? "" : "s"} a esta editorial.
                </p>
              </div>
              <Link
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 sm:w-auto"
                href={`/publicaciones?publisherId=${publisher.id}`}
              >
                Ver catálogo filtrado
              </Link>
            </div>

            {publications.length === 0 ? (
              <p className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
                No hay publicaciones asociadas a esta editorial en el catálogo activo.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
                {publications.map((publication) => (
                  <PublicationRow key={publication.id} publication={publication} />
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-semibold text-slate-950">Colecciones</h2>
            {collections.length === 0 ? (
              <p className="mt-4 rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
                No hay colecciones asociadas a esta editorial en el catálogo activo.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {collections.map((collection) => (
                  <CollectionCard collection={collection} key={collection.id} />
                ))}
              </div>
            )}
          </section>
        </article>
      </div>
    </main>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-md border border-blue-100 bg-white p-4 shadow-sm">
      <dt className="text-xs font-semibold uppercase tracking-normal text-blue-900">{label}</dt>
      <dd className="mt-1 text-3xl font-bold text-slate-950">{value}</dd>
    </div>
  );
}

function DescriptionPair({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-950">{value}</dd>
    </div>
  );
}

function EmailPair({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | undefined;
}) {
  if (value === undefined) {
    return <DescriptionPair label={label} value="No registrado" />;
  }

  return (
    <div className="min-w-0">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words">
        <a className="text-blue-800 hover:text-blue-950" href={`mailto:${value}`}>
          {value}
        </a>
      </dd>
    </div>
  );
}

function LinkPair({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string | undefined;
}) {
  if (value === undefined) {
    return <DescriptionPair label={label} value="No registrado" />;
  }

  return (
    <div className="min-w-0">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 break-words">
        <a className="text-blue-800 hover:text-blue-950" href={value}>
          {value}
        </a>
      </dd>
    </div>
  );
}

function OrganizationPair({ publisher }: { readonly publisher: PublisherDetail }) {
  const name = publisher.university.officialName;

  if (publisher.university.website === undefined) {
    return <DescriptionPair label="Entidad responsable" value={name} />;
  }

  return (
    <div className="min-w-0">
      <dt className="font-semibold text-slate-500">Entidad responsable</dt>
      <dd className="mt-1 break-words">
        <a className="text-blue-800 hover:text-blue-950" href={publisher.university.website}>
          {name}
        </a>
      </dd>
    </div>
  );
}

function PublicationRow({ publication }: { readonly publication: PublicationSummary }) {
  return (
    <li className="grid gap-3 p-4 transition hover:bg-blue-50 md:grid-cols-[minmax(0,1fr)_160px] md:items-start">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
          {publication.publicationDate} · {publication.type}
          {publication.license === undefined ? "" : ` · ${publication.license}`}
        </p>
        <Link
          className="mt-1 block break-words text-base font-semibold leading-6 text-slate-950 hover:text-blue-900"
          href={`/publicaciones/${publication.id}`}
        >
          {publication.title}
        </Link>
        {publication.subjects.length === 0 ? null : (
          <div className="mt-3 flex flex-wrap gap-2">
            {publication.subjects.slice(0, 4).map((subject) => (
              <span
                className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-900"
                key={subject.identifier}
              >
                {subject.preferredLabel}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="text-left text-sm text-slate-600 md:text-right">
        {publication.primaryIdentifier === undefined ? null : (
          <p className="break-words font-medium text-slate-800">
            {publication.primaryIdentifier.type.toUpperCase()}:{" "}
            {publication.primaryIdentifier.value}
          </p>
        )}
        <p className="mt-1">{publication.language.toUpperCase()}</p>
      </div>
    </li>
  );
}

function CollectionCard({ collection }: { readonly collection: CollectionSummary }) {
  return (
    <article className="rounded-md border border-slate-200 border-t-blue-900 border-t-4 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
        {collection.publicationCount} publicación{collection.publicationCount === 1 ? "" : "es"}
      </p>
      <Link
        className="mt-2 block text-base font-semibold text-slate-950 hover:text-blue-900"
        href={`/colecciones/${collection.id}`}
      >
        {collection.title}
      </Link>
      {collection.editorialSeries === undefined ? null : (
        <p className="mt-2 text-sm text-slate-600">{collection.editorialSeries}</p>
      )}
    </article>
  );
}

function countSubjects(publications: readonly PublicationSummary[]): number {
  return new Set(
    publications.flatMap((publication) =>
      publication.subjects.map((subject) => subject.identifier),
    ),
  ).size;
}

function formatResponsibleEntity(publisher: PublisherDetail): string {
  return publisher.university.acronym === undefined
    ? publisher.university.officialName
    : `${publisher.university.officialName} (${publisher.university.acronym})`;
}

function buildPublisherJsonLd(publisher: PublisherDetail, url: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${url}#publisher`,
    url,
    name: publisher.officialName,
    alternateName: publisher.acronym,
    description: publisher.description,
    identifier: publisher.publisherCode ?? publisher.id,
    address: {
      "@type": "PostalAddress",
      addressLocality: publisher.province,
      addressCountry: publisher.country,
    },
    sameAs: publisher.website,
    parentOrganization: {
      "@type": "Organization",
      "@id": `${publisher.university.website ?? url}#parent-organization`,
      name: publisher.university.officialName,
      alternateName: publisher.university.acronym,
      identifier: publisher.university.id,
      url: publisher.university.website,
      address: {
        "@type": "PostalAddress",
        addressLocality: publisher.university.province,
        addressCountry: publisher.university.country,
      },
    },
    contactPoint:
      publisher.contactPoint === undefined
        ? undefined
        : {
            "@type": "ContactPoint",
            email: publisher.contactPoint.email,
            telephone: publisher.contactPoint.telephone,
            url: publisher.contactPoint.url,
            contactType: "institutional",
          },
  };
}

function buildPublisherUrl(id: string): string {
  return `${getRuntimeConfig().publicBaseUrl}/editoriales/${id}`;
}

interface PublisherProfile {
  readonly publisher: PublisherDetail;
  readonly publications: readonly PublicationSummary[];
  readonly publicationCount: number;
  readonly collections: readonly CollectionSummary[];
}

async function getPublisherProfileOrNull(id: string): Promise<PublisherProfile | null> {
  try {
    const { collectionService, publicationService, publisherService } =
      await createCatalogServices();
    const publisher = toPublisherDetail(await publisherService.getPublisher(id));
    const [publications, collectionProfiles] = await Promise.all([
      publicationService.listPublications({ page: 1, pageSize: 100, publisherId: publisher.id }),
      collectionService.listCollections({ page: 1, pageSize: 100 }),
    ]);

    return {
      publisher,
      publications: publications.data.map(toPublicationSummary),
      publicationCount: publications.pagination.total,
      collections: collectionProfiles.data
        .filter((profile) => profile.collection.publisher().id().value() === publisher.id)
        .map((profile) => toCollectionSummary(profile.collection, profile.publications.length)),
    };
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "PNPU-404") {
      return null;
    }

    throw error;
  }
}

async function getPublisherDetailOrNull(id: string): Promise<PublisherDetail | null> {
  const profile = await getPublisherProfileOrNull(id);

  return profile?.publisher ?? null;
}
