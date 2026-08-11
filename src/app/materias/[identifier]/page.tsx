import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ApplicationError, SubjectDetail, toSubjectDetail } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { JsonLdObject, JsonLdScript } from "@/shared/seo/json-ld";

import { PageHero } from "../../page-hero";

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
    <main className="min-h-screen bg-[#eef3f8]">
      <JsonLdScript
        data={buildSubjectJsonLd(subject, buildSubjectUrl(subject.identifier))}
        id="subject-jsonld"
      />
      <PageHero
        description="Materia normalizada del vocabulario público PNPU utilizada para clasificar publicaciones universitarias y facilitar navegación temática."
        eyebrow={subject.identifier}
        maxWidth="max-w-5xl"
        title={subject.preferredLabel}
      >
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-md bg-white px-4 py-2 text-sm font-semibold text-blue-950 hover:bg-blue-50"
            href={`/publicaciones?subject=${encodeURIComponent(subject.identifier)}`}
          >
            Ver catálogo filtrado
          </Link>
          {subject.uri === undefined ? null : (
            <a
              className="inline-flex rounded-md border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
              href={subject.uri}
            >
              Ver vocabulario
            </a>
          )}
        </div>
      </PageHero>

      <article className="mx-auto max-w-5xl px-6 py-8">
        <dl className="mt-8 grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Identificador</dt>
            <dd className="mt-1 break-all text-neutral-950">{subject.identifier}</dd>
          </div>
          {subject.uri === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">URI</dt>
              <dd className="mt-1">
                <a className="break-all text-blue-800 hover:text-blue-950" href={subject.uri}>
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
              className="inline-flex rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
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
                    className="font-medium text-blue-800 hover:text-blue-950"
                    href={`/editoriales/${publication.publisher.id}`}
                  >
                    {publication.publisher.officialName}
                  </Link>{" "}
                  · {publication.publicationDate}
                </p>
                <Link
                  className="mt-1 block font-semibold text-neutral-950 hover:text-blue-800"
                  href={`/publicaciones/${publication.id}`}
                >
                  {publication.title}
                </Link>
                {publication.subtitle === undefined ? null : (
                  <p className="mt-1 text-sm text-neutral-700">{publication.subtitle}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-neutral-700">
                  {publication.license === undefined ? null : (
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-900">
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
