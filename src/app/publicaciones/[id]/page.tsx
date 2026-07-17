import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ApplicationError,
  IdentifierDto,
  PublicationDetail,
  ResourceDto,
  toPublicationDetail,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { JsonLdObject, JsonLdScript } from "@/shared/seo/json-ld";

interface PublicationPageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: PublicationPageProps): Promise<Metadata> {
  const { id } = await params;
  const publication = await getPublicationDetailOrNull(id);
  const canonicalUrl = buildPublicationUrl(id);

  if (publication === null) {
    return {
      title: "Publicación no encontrada | PNPU",
    };
  }

  return {
    title: `${publication.title} | PNPU`,
    description: publication.abstract ?? `Ficha pública de ${publication.title}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: publication.title,
      description: publication.abstract ?? `Ficha pública de ${publication.title}.`,
      type: "book",
      url: canonicalUrl,
    },
  };
}

export default async function PublicationDetailPage({ params }: PublicationPageProps) {
  const { id } = await params;
  const publication = await getPublicationDetailOrNull(id);

  if (publication === null) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <JsonLdScript
        data={buildPublicationJsonLd(publication, buildPublicationUrl(publication.id))}
        id="publication-jsonld"
      />
      <nav className="flex flex-wrap gap-3 text-sm" aria-label="Breadcrumb">
        <Link className="font-medium text-green-800 hover:text-green-950" href="/">
          PNPU
        </Link>
        <span className="text-neutral-500">/</span>
        <Link className="font-medium text-green-800 hover:text-green-950" href="/publicaciones">
          Publicaciones
        </Link>
      </nav>

      <article className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          {publication.type}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-neutral-950 md:text-5xl">
          {publication.title}
        </h1>
        {publication.subtitle === undefined ? null : (
          <p className="mt-4 max-w-3xl text-xl leading-8 text-neutral-700">
            {publication.subtitle}
          </p>
        )}
        {publication.abstract === undefined ? null : (
          <p className="mt-6 max-w-3xl text-base leading-7 text-neutral-700">
            {publication.abstract}
          </p>
        )}
        <dl className="mt-8 grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Editorial</dt>
            <dd className="mt-1">
              <Link
                className="font-medium text-green-800 hover:text-green-950"
                href={`/editoriales/${publication.publisher.id}`}
              >
                {publication.publisher.officialName}
              </Link>
            </dd>
          </div>
          {publication.collection === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Colección</dt>
              <dd className="mt-1">
                <Link
                  className="font-medium text-green-800 hover:text-green-950"
                  href={`/colecciones/${publication.collection.id}`}
                >
                  {publication.collection.title}
                </Link>
                {publication.collection.collectionCode === undefined ? null : (
                  <span className="ml-2 text-sm text-neutral-600">
                    {publication.collection.collectionCode}
                  </span>
                )}
                {publication.collection.editorialSeries === undefined ? null : (
                  <span className="ml-2 text-sm text-neutral-600">
                    {publication.collection.editorialSeries}
                  </span>
                )}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Fecha</dt>
            <dd className="mt-1 text-neutral-950">{publication.publicationDate}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Idioma</dt>
            <dd className="mt-1 text-neutral-950">{publication.language}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Formato</dt>
            <dd className="mt-1 text-neutral-950">{publication.format}</dd>
          </div>
          {publication.license === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Licencia</dt>
              <dd className="mt-1 text-neutral-950">{publication.license}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-neutral-600">ID PNPU</dt>
            <dd className="mt-1 break-all text-neutral-950">{publication.id}</dd>
          </div>
        </dl>

        <section className="mt-8 grid gap-3 md:grid-cols-3" aria-label="Identificadores destacados">
          {["isbn", "doi", "uri"].map((type) => {
            const identifier = publication.identifiers.find((item) => item.type === type);

            if (identifier === undefined) {
              return null;
            }

            return (
              <div className="rounded-md border border-neutral-200 bg-white px-4 py-3" key={type}>
                <p className="text-xs font-semibold uppercase text-neutral-500">{type}</p>
                <IdentifierValue identifier={identifier} />
              </div>
            );
          })}
        </section>

        <section className="mt-8 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-950">Citación</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-700">{buildCitation(publication)}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">Autores y contribuyentes</h2>
          <ul className="mt-3 grid gap-2">
            {publication.contributors.map((contributor) => (
              <li
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={contributor.id}
              >
                <Link
                  className="font-medium text-neutral-950 hover:text-green-800"
                  href={`/autores/${contributor.id}`}
                >
                  {contributor.name}
                </Link>
                <span className="ml-2 text-sm text-neutral-600">
                  {contributor.roles.join(", ")}
                </span>
                {contributor.orcid === undefined ? null : (
                  <a
                    className="ml-0 mt-1 block text-sm text-green-800 hover:text-green-950 md:ml-2 md:inline"
                    href={contributor.orcid}
                  >
                    {contributor.orcid}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">Materias</h2>
          <ul className="mt-3 grid gap-2">
            {publication.subjects.map((subject) => (
              <li
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={subject.identifier}
              >
                <span className="font-medium text-neutral-950">{subject.preferredLabel}</span>
                <span className="ml-2 text-sm text-neutral-600">{subject.identifier}</span>
                <Link
                  className="ml-0 mt-1 block text-sm text-green-800 hover:text-green-950 md:ml-2 md:inline"
                  href={`/materias/${encodeURIComponent(subject.identifier)}`}
                >
                  Ver publicaciones
                </Link>
                {subject.uri === undefined ? null : (
                  <a
                    className="ml-0 mt-1 block text-sm text-green-800 hover:text-green-950 md:ml-2 md:inline"
                    href={subject.uri}
                  >
                    Vocabulario
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">Identificadores</h2>
          <ul className="mt-3 grid gap-2">
            {publication.identifiers.map((identifier) => (
              <li
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={identifier.value}
              >
                <span className="font-semibold uppercase text-neutral-600">{identifier.type}</span>
                <span className="ml-3">
                  <IdentifierValue identifier={identifier} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">Recursos digitales</h2>
          <ul className="mt-3 grid gap-3">
            {publication.resources.map((resource) => (
              <li
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={resource.url}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-neutral-950">{resource.format}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Tipo: {resource.type}
                      {resource.language === undefined ? "" : ` · Idioma: ${resource.language}`}
                      {resource.license === undefined ? "" : ` · Licencia: ${resource.license}`}
                      {resource.fileSize === undefined
                        ? ""
                        : ` · Tamaño: ${resource.fileSize.toLocaleString("es-CU")} bytes`}
                    </p>
                    {resource.checksum === undefined ? null : (
                      <p className="mt-1 break-all text-sm text-neutral-600">
                        Checksum: {resource.checksum}
                      </p>
                    )}
                  </div>
                  <a
                    className="inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
                    href={resource.url}
                  >
                    Abrir recurso
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {publication.keywords === undefined || publication.keywords.length === 0 ? null : (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-neutral-950">Palabras clave</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {publication.keywords.map((keyword) => (
                <li
                  className="rounded-md bg-white px-3 py-2 text-sm text-neutral-800"
                  key={keyword}
                >
                  {keyword}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}

function buildPublicationJsonLd(publication: PublicationDetail, url: string): JsonLdObject {
  const isbn = publication.identifiers.find((identifier) => identifier.type === "isbn")?.value;

  return {
    "@context": "https://schema.org",
    "@type": "Book",
    "@id": `${url}#publication`,
    url,
    name: publication.title,
    alternateName: publication.subtitle,
    description: publication.abstract,
    datePublished: publication.publicationDate,
    inLanguage: publication.language,
    bookFormat: publication.format,
    license: publication.license,
    isbn,
    identifier: publication.identifiers.map(toIdentifierJsonLd),
    author: publication.contributors.map((contributor) => ({
      "@type": "Person",
      name: contributor.name,
      identifier: contributor.id,
      sameAs: contributor.orcid,
    })),
    publisher: {
      "@type": "Organization",
      "@id": `${buildPublisherUrl(publication.publisher.id)}#publisher`,
      name: publication.publisher.officialName,
      alternateName: publication.publisher.acronym,
    },
    isPartOf:
      publication.collection === undefined
        ? undefined
        : {
            "@type": "CreativeWorkSeries",
            "@id": `${getRuntimeConfig().publicBaseUrl}/colecciones/${publication.collection.id}#collection`,
            name: publication.collection.title,
          },
    about: publication.subjects.map((subject) => ({
      "@type": "DefinedTerm",
      termCode: subject.identifier,
      name: subject.preferredLabel,
      url: subject.uri,
    })),
    keywords: publication.keywords,
    encoding: publication.resources.map(toResourceJsonLd),
  };
}

function toIdentifierJsonLd(identifier: IdentifierDto): JsonLdObject {
  return {
    "@type": "PropertyValue",
    propertyID: identifier.type,
    value: identifier.value,
  };
}

function IdentifierValue({ identifier }: { readonly identifier: IdentifierDto }) {
  const href = buildIdentifierHref(identifier);

  if (href === undefined) {
    return (
      <span className="break-all text-sm font-medium text-neutral-950">{identifier.value}</span>
    );
  }

  return (
    <a className="break-all text-sm font-medium text-green-800 hover:text-green-950" href={href}>
      {identifier.value}
    </a>
  );
}

function buildIdentifierHref(identifier: IdentifierDto): string | undefined {
  if (identifier.type === "doi") {
    return `https://doi.org/${identifier.value.replace(/^https?:\/\/doi\.org\//, "")}`;
  }

  if (identifier.type === "uri" && /^https?:\/\//.test(identifier.value)) {
    return identifier.value;
  }

  return undefined;
}

function buildCitation(publication: PublicationDetail): string {
  const authors = publication.contributors.map((contributor) => contributor.name).join("; ");
  const publisher = publication.publisher.acronym ?? publication.publisher.officialName;
  const year = publication.publicationDate.slice(0, 4);
  const primaryIdentifier =
    publication.primaryIdentifier === undefined
      ? ""
      : ` ${publication.primaryIdentifier.type.toUpperCase()}: ${publication.primaryIdentifier.value}.`;

  return `${authors}. (${year}). ${publication.title}. ${publisher}.${primaryIdentifier}`;
}

function toResourceJsonLd(resource: ResourceDto): JsonLdObject {
  return {
    "@type": "MediaObject",
    contentUrl: resource.url,
    encodingFormat: resource.format,
    contentSize: resource.fileSize,
    inLanguage: resource.language,
    license: resource.license,
    identifier: resource.checksum,
  };
}

function buildPublicationUrl(id: string): string {
  return `${getRuntimeConfig().publicBaseUrl}/publicaciones/${id}`;
}

function buildPublisherUrl(id: string): string {
  return `${getRuntimeConfig().publicBaseUrl}/editoriales/${id}`;
}

async function getPublicationDetailOrNull(id: string) {
  try {
    const { publicationService } = await createCatalogServices();
    return toPublicationDetail(await publicationService.getPublication(id));
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "PNPU-404") {
      return null;
    }

    throw error;
  }
}
