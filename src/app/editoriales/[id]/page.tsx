import type { Metadata } from "next";
import Image from "next/image";
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
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <JsonLdScript
        data={buildPublisherJsonLd(publisher, buildPublisherUrl(publisher.id))}
        id="publisher-jsonld"
      />
      <nav className="flex flex-wrap gap-3 text-sm" aria-label="Breadcrumb">
        <Link className="font-medium text-green-800 hover:text-green-950" href="/">
          PNPU
        </Link>
        <span className="text-neutral-500">/</span>
        <Link className="font-medium text-green-800 hover:text-green-950" href="/editoriales">
          Editoriales
        </Link>
      </nav>

      <article className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          Editorial universitaria
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-neutral-950 md:text-5xl">
          {publisher.officialName}
        </h1>
        {publisher.logo === undefined ? null : (
          <div className="mt-5">
            <Image
              alt={`Logo de ${publisher.officialName}`}
              className="h-16 w-auto rounded-md border border-neutral-200 bg-white p-2"
              height={64}
              unoptimized
              src={publisher.logo}
              width={160}
            />
          </div>
        )}
        {publisher.description === undefined ? null : (
          <p className="mt-6 max-w-3xl text-base leading-7 text-neutral-700">
            {publisher.description}
          </p>
        )}

        <dl className="mt-8 grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          {publisher.acronym === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Sigla</dt>
              <dd className="mt-1 text-neutral-950">{publisher.acronym}</dd>
            </div>
          )}
          {publisher.publisherCode === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Código institucional</dt>
              <dd className="mt-1 text-neutral-950">{publisher.publisherCode}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Universidad</dt>
            <dd className="mt-1 text-neutral-950">{publisher.university.officialName}</dd>
          </div>
          {publisher.university.acronym === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Sigla universitaria</dt>
              <dd className="mt-1 text-neutral-950">{publisher.university.acronym}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-neutral-600">País</dt>
            <dd className="mt-1 text-neutral-950">{publisher.country}</dd>
          </div>
          {publisher.province === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Provincia</dt>
              <dd className="mt-1 text-neutral-950">{publisher.province}</dd>
            </div>
          )}
          {publisher.website === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Sitio web</dt>
              <dd className="mt-1">
                <a className="text-green-800 hover:text-green-950" href={publisher.website}>
                  {publisher.website}
                </a>
              </dd>
            </div>
          )}
          {publisher.contactPoint?.email === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Correo de contacto</dt>
              <dd className="mt-1">
                <a
                  className="text-green-800 hover:text-green-950"
                  href={`mailto:${publisher.contactPoint.email}`}
                >
                  {publisher.contactPoint.email}
                </a>
              </dd>
            </div>
          )}
          {publisher.contactPoint?.telephone === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Teléfono</dt>
              <dd className="mt-1 text-neutral-950">{publisher.contactPoint.telephone}</dd>
            </div>
          )}
          {publisher.contactPoint?.url === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Contacto institucional</dt>
              <dd className="mt-1">
                <a
                  className="text-green-800 hover:text-green-950"
                  href={publisher.contactPoint.url}
                >
                  {publisher.contactPoint.url}
                </a>
              </dd>
            </div>
          )}
        </dl>

        <section className="mt-8 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-950">Datos institucionales</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Estos datos provienen del registro institucional definido para la PNPU. La plataforma no
            permite modificarlos desde la ficha pública.
          </p>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-neutral-600">ID PNPU editorial</dt>
              <dd className="mt-1 break-all text-neutral-950">{publisher.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-neutral-600">ID PNPU universidad</dt>
              <dd className="mt-1 break-all text-neutral-950">{publisher.university.id}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">Publicaciones</h2>
              <p className="mt-1 text-sm text-neutral-600">
                {publicationCount} publicación{publicationCount === 1 ? "" : "es"} asociada
                {publicationCount === 1 ? "" : "s"} a esta editorial.
              </p>
            </div>
            <Link
              className="inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
              href={`/publicaciones?publisherId=${publisher.id}`}
            >
              Ver catálogo filtrado
            </Link>
          </div>
          <ul className="mt-4 grid gap-3">
            {publications.map((publication) => (
              <li
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={publication.id}
              >
                <p className="text-sm text-neutral-600">
                  {publication.publicationDate} · {publication.type}
                  {publication.license === undefined ? "" : ` · ${publication.license}`}
                </p>
                <Link
                  className="mt-1 block font-semibold text-neutral-950 hover:text-green-800"
                  href={`/publicaciones/${publication.id}`}
                >
                  {publication.title}
                </Link>
                {publication.subjects.length === 0 ? null : (
                  <p className="mt-2 text-sm text-neutral-600">
                    {publication.subjects.map((subject) => subject.preferredLabel).join(", ")}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">Colecciones</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {collections.map((collection) => (
              <article
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={collection.id}
              >
                <p className="text-sm text-neutral-600">
                  {collection.publicationCount} publicación
                  {collection.publicationCount === 1 ? "" : "es"}
                </p>
                <Link
                  className="mt-1 block font-semibold text-neutral-950 hover:text-green-800"
                  href={`/colecciones/${collection.id}`}
                >
                  {collection.title}
                </Link>
                {collection.editorialSeries === undefined ? null : (
                  <p className="mt-1 text-sm text-neutral-600">{collection.editorialSeries}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
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
      "@type": "CollegeOrUniversity",
      "@id": `${publisher.university.website ?? url}#university`,
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
