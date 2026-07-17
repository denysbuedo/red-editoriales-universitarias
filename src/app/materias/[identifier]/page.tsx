import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationError, SubjectDetail, toSubjectDetail } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { JsonLdObject, JsonLdScript } from "@/shared/seo/json-ld";

interface SubjectPageProps {
  readonly params: Promise<{
    readonly identifier: string;
  }>;
}

export async function generateMetadata({ params }: SubjectPageProps): Promise<Metadata> {
  const { identifier } = await params;
  const decodedIdentifier = decodeURIComponent(identifier);
  const subject = await getSubjectDetailOrNull(decodedIdentifier);
  const canonicalUrl = buildSubjectUrl(decodedIdentifier);

  if (subject === null) {
    return {
      title: "Materia no encontrada | PNPU",
    };
  }

  return {
    title: `${subject.preferredLabel} | PNPU`,
    description: `Publicaciones universitarias clasificadas bajo ${subject.preferredLabel}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: subject.preferredLabel,
      description: `Publicaciones universitarias clasificadas bajo ${subject.preferredLabel}.`,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function SubjectDetailPage({ params }: SubjectPageProps) {
  const { identifier } = await params;
  const decodedIdentifier = decodeURIComponent(identifier);
  const subject = await getSubjectDetailOrNull(decodedIdentifier);

  if (subject === null) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <JsonLdScript
        data={buildSubjectJsonLd(subject, buildSubjectUrl(subject.identifier))}
        id="subject-jsonld"
      />
      <nav className="flex flex-wrap gap-3 text-sm" aria-label="Breadcrumb">
        <Link className="font-medium text-green-800 hover:text-green-950" href="/">
          PNPU
        </Link>
        <span className="text-neutral-500">/</span>
        <Link className="font-medium text-green-800 hover:text-green-950" href="/materias">
          Materias
        </Link>
      </nav>

      <article className="mt-8">
        <p className="break-all text-sm font-semibold uppercase tracking-normal text-green-800">
          {subject.identifier}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-neutral-950 md:text-5xl">
          {subject.preferredLabel}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-neutral-700">
          Materia normalizada del vocabulario público PNPU utilizada para clasificar publicaciones
          universitarias y facilitar navegación temática.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-md bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-950"
            href={`/publicaciones?subject=${encodeURIComponent(subject.identifier)}`}
          >
            Ver catálogo filtrado
          </Link>
          {subject.uri === undefined ? null : (
            <a
              className="inline-flex rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 hover:border-green-800 hover:text-green-900"
              href={subject.uri}
            >
              Ver vocabulario
            </a>
          )}
        </div>

        <dl className="mt-8 grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Identificador</dt>
            <dd className="mt-1 break-all text-neutral-950">{subject.identifier}</dd>
          </div>
          {subject.uri === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">URI</dt>
              <dd className="mt-1">
                <a className="break-all text-green-800 hover:text-green-950" href={subject.uri}>
                  {subject.uri}
                </a>
              </dd>
            </div>
          )}
          {subject.broader === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Materia superior</dt>
              <dd className="mt-1 break-all text-neutral-950">{subject.broader}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Publicaciones</dt>
            <dd className="mt-1 text-neutral-950">{subject.publicationCount}</dd>
          </div>
          {subject.related === undefined || subject.related.length === 0 ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Materias relacionadas</dt>
              <dd className="mt-1 break-all text-neutral-950">{subject.related.join(", ")}</dd>
            </div>
          )}
        </dl>

        <section className="mt-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-950">Publicaciones asociadas</h2>
              <p className="mt-1 text-sm text-neutral-600">
                Catálogo filtrado por {subject.preferredLabel}.
              </p>
            </div>
            <Link
              className="inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
              href={`/publicaciones?subject=${encodeURIComponent(subject.identifier)}`}
            >
              Ver en catálogo
            </Link>
          </div>
          <ul className="mt-3 grid gap-3">
            {subject.publications.map((publication) => (
              <li
                className="rounded-md border border-neutral-200 bg-white px-4 py-3"
                key={publication.id}
              >
                <p className="text-sm text-neutral-600">
                  <Link
                    className="font-medium text-green-800 hover:text-green-950"
                    href={`/editoriales/${publication.publisher.id}`}
                  >
                    {publication.publisher.officialName}
                  </Link>{" "}
                  · {publication.publicationDate}
                </p>
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

function buildSubjectJsonLd(subject: SubjectDetail, url: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${url}#subject`,
    url,
    termCode: subject.identifier,
    name: subject.preferredLabel,
    inDefinedTermSet: subject.uri,
    broader: subject.broader,
    related: subject.related,
    subjectOf: subject.publications.map((publication) => ({
      "@type": "Book",
      "@id": `${getRuntimeConfig().publicBaseUrl}/publicaciones/${publication.id}#publication`,
      name: publication.title,
      url: `${getRuntimeConfig().publicBaseUrl}/publicaciones/${publication.id}`,
    })),
  };
}

function buildSubjectUrl(identifier: string): string {
  return `${getRuntimeConfig().publicBaseUrl}/materias/${encodeURIComponent(identifier)}`;
}

async function getSubjectDetailOrNull(identifier: string) {
  try {
    const { subjectService } = await createCatalogServices();
    const profile = await subjectService.getSubject(identifier);
    return toSubjectDetail(profile.subject, profile.publications);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "PNPU-404") {
      return null;
    }

    throw error;
  }
}
