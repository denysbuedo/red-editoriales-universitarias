import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ApplicationError,
  CollectionDetail,
  toCollectionDetail,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { JsonLdObject, JsonLdScript } from "@/shared/seo/json-ld";

interface CollectionPageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const collection = await getCollectionDetailOrNull(id);
  const canonicalUrl = buildCollectionUrl(id);

  if (collection === null) {
    return { title: "Colección no encontrada | PNPU" };
  }

  return {
    title: `${collection.title} | PNPU`,
    description: collection.description ?? `Ficha pública de ${collection.title}.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: collection.title,
      description: collection.description ?? `Ficha pública de ${collection.title}.`,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function CollectionDetailPage({ params }: CollectionPageProps) {
  const { id } = await params;
  const collection = await getCollectionDetailOrNull(id);

  if (collection === null) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <JsonLdScript
        data={buildCollectionJsonLd(collection, buildCollectionUrl(collection.id))}
        id="collection-jsonld"
      />
      <nav className="flex flex-wrap gap-3 text-sm" aria-label="Breadcrumb">
        <Link className="font-medium text-green-800 hover:text-green-950" href="/">
          PNPU
        </Link>
        <span className="text-neutral-500">/</span>
        <Link className="font-medium text-green-800 hover:text-green-950" href="/colecciones">
          Colecciones
        </Link>
      </nav>

      <article className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          {collection.editorialSeries ?? "Colección editorial"}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-neutral-950 md:text-5xl">
          {collection.title}
        </h1>
        {collection.description === undefined ? null : (
          <p className="mt-6 max-w-3xl text-base leading-7 text-neutral-700">
            {collection.description}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-md bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-950"
            href={`/publicaciones?collectionId=${collection.id}`}
          >
            Ver publicaciones de la colección
          </Link>
          <Link
            className="inline-flex rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 hover:border-green-800 hover:text-green-900"
            href={`/editoriales/${collection.publisher.id}`}
          >
            Ver editorial
          </Link>
        </div>

        <dl className="mt-8 grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Editorial</dt>
            <dd className="mt-1">
              <Link
                className="font-medium text-green-800 hover:text-green-950"
                href={`/editoriales/${collection.publisher.id}`}
              >
                {collection.publisher.officialName}
              </Link>
            </dd>
          </div>
          {collection.collectionCode === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Código de colección</dt>
              <dd className="mt-1 text-neutral-950">{collection.collectionCode}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-neutral-600">ID PNPU colección</dt>
            <dd className="mt-1 break-all text-neutral-950">{collection.id}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Publicaciones</dt>
            <dd className="mt-1 text-neutral-950">{collection.publicationCount}</dd>
          </div>
          {collection.editorialSeries === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Serie editorial</dt>
              <dd className="mt-1 text-neutral-950">{collection.editorialSeries}</dd>
            </div>
          )}
        </dl>

        {collection.subjects === undefined || collection.subjects.length === 0 ? null : (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-neutral-950">Materias de la colección</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {collection.subjects.map((subject) => (
                <Link
                  className="rounded-md bg-white px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
                  href={`/materias/${encodeURIComponent(subject.identifier)}`}
                  key={subject.identifier}
                >
                  {subject.preferredLabel}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">Publicaciones de la colección</h2>
          <ul className="mt-3 grid gap-3">
            {collection.publications.map((publication) => (
              <li
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={publication.id}
              >
                <p className="text-sm text-neutral-600">{publication.publicationDate}</p>
                <Link
                  className="mt-1 block font-semibold text-neutral-950 hover:text-green-800"
                  href={`/publicaciones/${publication.id}`}
                >
                  {publication.title}
                </Link>
                {publication.subtitle === undefined ? null : (
                  <p className="mt-1 text-sm text-neutral-700">{publication.subtitle}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-neutral-700">
                  <span className="rounded-md bg-neutral-100 px-2 py-1">{publication.type}</span>
                  <span className="rounded-md bg-neutral-100 px-2 py-1">
                    {publication.language.toUpperCase()}
                  </span>
                  {publication.license === undefined ? null : (
                    <span className="rounded-md bg-green-50 px-2 py-1 text-green-900">
                      {publication.license}
                    </span>
                  )}
                  {publication.primaryIdentifier === undefined ? null : (
                    <span className="rounded-md bg-neutral-100 px-2 py-1">
                      {publication.primaryIdentifier.type.toUpperCase()}:{" "}
                      {publication.primaryIdentifier.value}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

function buildCollectionJsonLd(collection: CollectionDetail, url: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: collection.title,
    description: collection.description,
    identifier: collection.collectionCode ?? collection.id,
    publisher: {
      "@type": "Organization",
      "@id": `${getRuntimeConfig().publicBaseUrl}/editoriales/${collection.publisher.id}#publisher`,
      name: collection.publisher.officialName,
    },
    about: collection.subjects?.map((subject) => ({
      "@type": "DefinedTerm",
      termCode: subject.identifier,
      name: subject.preferredLabel,
      url: subject.uri,
    })),
    hasPart: collection.publications.map((publication) => ({
      "@type": "Book",
      "@id": `${getRuntimeConfig().publicBaseUrl}/publicaciones/${publication.id}#publication`,
      name: publication.title,
      url: `${getRuntimeConfig().publicBaseUrl}/publicaciones/${publication.id}`,
    })),
  };
}

function buildCollectionUrl(id: string): string {
  return `${getRuntimeConfig().publicBaseUrl}/colecciones/${id}`;
}

async function getCollectionDetailOrNull(id: string) {
  try {
    const { collectionService } = await createCatalogServices();
    const profile = await collectionService.getCollection(id);
    return toCollectionDetail(profile.collection, profile.publications);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "PNPU-404") {
      return null;
    }

    throw error;
  }
}
