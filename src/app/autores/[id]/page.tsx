import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ApplicationError,
  ContributorDetail,
  toContributorDetail,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";
import { getRuntimeConfig } from "@/shared/config/runtime-config";
import { JsonLdObject, JsonLdScript } from "@/shared/seo/json-ld";

interface ContributorPageProps {
  readonly params: Promise<{
    readonly id: string;
  }>;
}

export async function generateMetadata({ params }: ContributorPageProps): Promise<Metadata> {
  const { id } = await params;
  const contributor = await getContributorDetailOrNull(id);
  const canonicalUrl = buildContributorUrl(id);

  if (contributor === null) {
    return {
      title: "Autor no encontrado | PNPU",
    };
  }

  return {
    title: `${contributor.name} | PNPU`,
    description: contributor.biography ?? `Ficha pública de ${contributor.name}.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: contributor.name,
      description: contributor.biography ?? `Ficha pública de ${contributor.name}.`,
      type: "profile",
      url: canonicalUrl,
    },
  };
}

export default async function ContributorDetailPage({ params }: ContributorPageProps) {
  const { id } = await params;
  const contributor = await getContributorDetailOrNull(id);

  if (contributor === null) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12">
      <JsonLdScript
        data={buildContributorJsonLd(contributor, buildContributorUrl(contributor.id))}
        id="contributor-jsonld"
      />
      <nav className="flex flex-wrap gap-3 text-sm" aria-label="Breadcrumb">
        <Link className="font-medium text-green-800 hover:text-green-950" href="/">
          PNPU
        </Link>
        <span className="text-neutral-500">/</span>
        <Link className="font-medium text-green-800 hover:text-green-950" href="/autores">
          Autores
        </Link>
      </nav>

      <article className="mt-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          {contributor.roles.join(", ")}
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-neutral-950 md:text-5xl">
          {contributor.name}
        </h1>
        {contributor.biography === undefined ? null : (
          <p className="mt-6 max-w-3xl text-base leading-7 text-neutral-700">
            {contributor.biography}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="inline-flex rounded-md bg-green-900 px-4 py-2 text-sm font-semibold text-white hover:bg-green-950"
            href={`/publicaciones?contributorId=${contributor.id}`}
          >
            Ver publicaciones del autor
          </Link>
          {contributor.orcid === undefined ? null : (
            <a
              className="inline-flex rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-900 hover:border-green-800 hover:text-green-900"
              href={contributor.orcid}
            >
              Ver ORCID
            </a>
          )}
        </div>

        <dl className="mt-8 grid gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Roles</dt>
            <dd className="mt-1 text-neutral-950">{formatRoles(contributor.roles)}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-neutral-600">Publicaciones</dt>
            <dd className="mt-1 text-neutral-950">{contributor.publicationCount}</dd>
          </div>
          {contributor.givenName === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Nombre</dt>
              <dd className="mt-1 text-neutral-950">{contributor.givenName}</dd>
            </div>
          )}
          {contributor.familyName === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Apellidos</dt>
              <dd className="mt-1 text-neutral-950">{contributor.familyName}</dd>
            </div>
          )}
          {contributor.affiliation === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">Afiliación</dt>
              <dd className="mt-1 text-neutral-950">{contributor.affiliation}</dd>
            </div>
          )}
          {contributor.country === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">País</dt>
              <dd className="mt-1 text-neutral-950">{contributor.country}</dd>
            </div>
          )}
          {contributor.orcid === undefined ? null : (
            <div>
              <dt className="text-sm font-semibold text-neutral-600">ORCID</dt>
              <dd className="mt-1">
                <a
                  className="break-all text-green-800 hover:text-green-950"
                  href={contributor.orcid}
                >
                  {contributor.orcid}
                </a>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-semibold text-neutral-600">ID PNPU autor</dt>
            <dd className="mt-1 break-all text-neutral-950">{contributor.id}</dd>
          </div>
        </dl>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-neutral-950">Publicaciones asociadas</h2>
          <ul className="mt-3 grid gap-3">
            {contributor.publications.map((publication) => (
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
                {publication.subjects.length === 0 ? null : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {publication.subjects.map((subject) => (
                      <Link
                        className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                        href={`/publicaciones?subject=${encodeURIComponent(subject.identifier)}`}
                        key={subject.identifier}
                      >
                        {subject.preferredLabel}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}

function buildContributorJsonLd(contributor: ContributorDetail, url: string): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": contributor.roles.includes("organization") ? "Organization" : "Person",
    "@id": `${url}#contributor`,
    url,
    identifier: contributor.id,
    name: contributor.name,
    givenName: contributor.givenName,
    familyName: contributor.familyName,
    affiliation: contributor.affiliation,
    nationality: contributor.country,
    description: contributor.biography,
    sameAs: contributor.orcid,
    workExample: contributor.publications.map((publication) => ({
      "@type": "Book",
      "@id": `${getRuntimeConfig().publicBaseUrl}/publicaciones/${publication.id}#publication`,
      name: publication.title,
      url: `${getRuntimeConfig().publicBaseUrl}/publicaciones/${publication.id}`,
    })),
  };
}

function formatRoles(roles: readonly string[]): string {
  return roles
    .map((role) => {
      if (role === "author") {
        return "Autor";
      }

      if (role === "editor") {
        return "Editor";
      }

      if (role === "organization") {
        return "Organización";
      }

      return role;
    })
    .join(", ");
}

function buildContributorUrl(id: string): string {
  return `${getRuntimeConfig().publicBaseUrl}/autores/${id}`;
}

async function getContributorDetailOrNull(id: string) {
  try {
    const { contributorService } = await createCatalogServices();
    const profile = await contributorService.getContributor(id);
    return toContributorDetail(profile.contributor, profile.publications);
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "PNPU-404") {
      return null;
    }

    throw error;
  }
}
