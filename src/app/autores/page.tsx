import type { Metadata } from "next";
import Link from "next/link";

import { toContributorAuthoritySummary } from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

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
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
        PNPU
      </Link>
      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          Autoridades
        </p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950 md:text-4xl">
          Autores y contribuyentes
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Directorio público de personas y entidades vinculadas a publicaciones universitarias.
        </p>
      </header>

      <section className="mt-8" aria-label="Listado de autores y contribuyentes">
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
              <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                <Link className="hover:text-green-800" href={`/autores/${contributor.id}`}>
                  {contributor.name}
                </Link>
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {contributor.roles.map((role) => (
                  <span
                    className="rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-900"
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
                <p className="mt-2 break-all text-sm text-green-800">{contributor.orcid}</p>
              )}
              <Link
                className="mt-5 inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
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
