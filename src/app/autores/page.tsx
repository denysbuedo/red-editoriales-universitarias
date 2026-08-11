import type { Metadata } from "next";
import Link from "next/link";

import { toContributorAuthoritySummary } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

import { PageHero } from "../page-hero";

export const metadata: Metadata = {
  title: "Autores | PNPU",
  description: "Autoridades públicas de autores y contribuyentes integrados en la PNPU.",
};

export const dynamic = "force-dynamic";

export default async function ContributorsPage() {
  const { contributorService } = await createCatalogServices();
  const contributors = await contributorService.listContributors({ page: 1, pageSize: 20 });
  const summaries = contributors.data.map((profile) =>
    toContributorAuthoritySummary(profile.contributor, profile.publications.length),
  );

  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Directorio público de personas y entidades vinculadas a publicaciones universitarias."
        eyebrow="Autoridades"
        title="Autores y contribuyentes"
      />

      <section
        className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
        aria-label="Listado de autores y contribuyentes"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {summaries.map((contributor) => (
            <article
              className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
              key={contributor.id}
            >
              <p className="text-sm text-neutral-600">
                {contributor.publicationCount} publicación
                {contributor.publicationCount === 1 ? "" : "es"}
              </p>
              <h2 className="mt-2 break-words text-lg font-semibold text-neutral-950 sm:text-xl">
                <Link className="hover:text-blue-800" href={`/autores/${contributor.id}`}>
                  {contributor.name}
                </Link>
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {contributor.roles.map((role) => (
                  <span
                    className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-900"
                    key={role}
                  >
                    {role}
                  </span>
                ))}
                {contributor.country === undefined ? null : (
                  <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700">
                    {contributor.country}
                  </span>
                )}
              </div>
              {contributor.affiliation === undefined ? null : (
                <p className="mt-2 text-sm text-neutral-700">{contributor.affiliation}</p>
              )}
              {contributor.orcid === undefined ? null : (
                <p className="mt-2 break-all text-sm text-blue-800">{contributor.orcid}</p>
              )}
              <Link
                className="mt-5 inline-flex w-full justify-center rounded-md border border-blue-800 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50 sm:w-auto"
                href={`/autores/${contributor.id}`}
              >
                Ver ficha
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
