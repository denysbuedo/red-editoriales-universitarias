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

import { PageHero } from "../../page-hero";

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
    <main className="min-h-screen bg-[#eef3f8]">
      <JsonLdScript
        data={buildCollectionJsonLd(collection, buildCollectionUrl(collection.id))}
        id="collection-jsonld"
      />
      <PageHero
        description={collection.description ?? `Ficha pública de ${collection.title}.`}
        eyebrow={collection.editorialSeries ?? "Colección editorial"}
        maxWidth="max-w-5xl"
        title={collection.title}
      >
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <Link
            className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-50"
            href={`/publicaciones?collectionId=${collection.id}`}
          >
            Ver publicaciones de la colección
          </Link>
          <Link
            className="inline-flex justify-center rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
            href={`/editoriales/${collection.publisher.id}`}
          >
            Ver editorial
          </Link>
        </div>
      </PageHero>

      <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <dl className="mt-8 grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Editorial</dt>
            <dd className="mt-1">
              <Link
                className="font-medium text-blue-800 hover:text-blue-950"
                href={`/editoriales/${collection.publisher.id}`}
              >
                {collection.publisher.officialName}
              </Link>
            </dd>
          </div>
          {collection.collectionCode === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Código de colección</dt>
              <dd className="mt-1 break-words text-neutral-950">{collection.collectionCode}</dd>
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
                  href={`/publicaciones?subject=${encodeURIComponent(subject.identifier)}`}
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
                  className="mt-1 block break-words font-semibold text-neutral-950 hover:text-blue-800"
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
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-900">
                      {publication.license}
                    </span>
                  )}
                  {publication.primaryIdentifier === undefined ? null : (
                    <span className="min-w-0 break-words rounded-md bg-neutral-100 px-2 py-1">
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
