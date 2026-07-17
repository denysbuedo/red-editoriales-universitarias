import Link from "next/link";

import {
  toPublisherSummary,
  toPublicationSummary,
  toSubjectAuthoritySummary,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

export default async function HomePage() {
  const {
    collectionService,
    contributorService,
    publicationService,
    publisherService,
    subjectService,
  } = await createCatalogServices();
  const [publications, publishers, contributors, collections, subjects, recentPublications] =
    await Promise.all([
      publicationService.listPublications({ page: 1, pageSize: 1 }),
      publisherService.listPublishers({ page: 1, pageSize: 4 }),
      contributorService.listContributors({ page: 1, pageSize: 1 }),
      collectionService.listCollections({ page: 1, pageSize: 1 }),
      subjectService.listSubjects({ page: 1, pageSize: 6 }),
      publicationService.listRecentPublications({ limit: 3 }),
    ]);
  const publisherSummaries = publishers.data.map(toPublisherSummary);
  const subjectSummaries = subjects.data.map((profile) =>
    toSubjectAuthoritySummary(profile.subject, profile.publications.length),
  );
  const recentSummaries = recentPublications.map(toPublicationSummary);

  return (
    <main className="min-h-screen bg-neutral-50">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-18">
          <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
            Plataforma nacional
          </p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <div>
              <h1 className="max-w-3xl text-4xl font-bold leading-tight text-neutral-950 md:text-5xl">
                Catálogo nacional de editoriales universitarias
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-neutral-700">
                Punto de acceso público a la producción editorial universitaria cubana, organizado
                por editoriales, colecciones, autores, materias y recursos digitales verificables.
              </p>
            </div>
            <nav
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1"
              aria-label="Accesos principales"
            >
              <PrimaryLink href="/publicaciones">Consultar catálogo</PrimaryLink>
              <SecondaryLink href="/editoriales">Directorio de editoriales</SecondaryLink>
              <SecondaryLink href="/estado">Estado del catálogo</SecondaryLink>
            </nav>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8" aria-label="Indicadores del catálogo">
        <dl className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Publicaciones" value={publications.pagination.total} />
          <MetricCard label="Editoriales" value={publishers.pagination.total} />
          <MetricCard label="Autores" value={contributors.pagination.total} />
          <MetricCard label="Colecciones" value={collections.pagination.total} />
        </dl>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
                Catálogo
              </p>
              <h2 className="mt-2 text-2xl font-bold text-neutral-950">Publicaciones recientes</h2>
            </div>
            <Link
              className="text-sm font-semibold text-green-800 hover:text-green-950"
              href="/publicaciones"
            >
              Ver todas
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {recentSummaries.map((publication) => (
              <article
                className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm"
                key={publication.id}
              >
                <p className="text-sm text-neutral-600">
                  {publication.publicationDate} · {publication.publisher.officialName}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-neutral-950">
                  <Link className="hover:text-green-800" href={`/publicaciones/${publication.id}`}>
                    {publication.title}
                  </Link>
                </h3>
                {publication.subjects.length === 0 ? null : (
                  <p className="mt-2 text-sm text-neutral-600">
                    {publication.subjects.map((subject) => subject.preferredLabel).join(", ")}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="grid gap-4">
          <section className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-950">Editoriales integradas</h2>
            <ul className="mt-3 grid gap-2">
              {publisherSummaries.map((publisher) => (
                <li key={publisher.id}>
                  <Link
                    className="text-sm font-medium text-green-800 hover:text-green-950"
                    href={`/editoriales/${publisher.id}`}
                  >
                    {publisher.acronym ?? publisher.officialName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-950">Materias principales</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {subjectSummaries.map((subject) => (
                <Link
                  className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                  href={`/materias/${encodeURIComponent(subject.identifier)}`}
                  key={subject.identifier}
                >
                  {subject.preferredLabel}
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function PrimaryLink({ children, href }: { readonly children: string; readonly href: string }) {
  return (
    <Link
      className="inline-flex h-10 items-center justify-center rounded-md bg-green-900 px-4 text-sm font-semibold text-white hover:bg-green-950"
      href={href}
    >
      {children}
    </Link>
  );
}

function SecondaryLink({ children, href }: { readonly children: string; readonly href: string }) {
  return (
    <Link
      className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-900 hover:border-green-800 hover:text-green-900"
      href={href}
    >
      {children}
    </Link>
  );
}

function MetricCard({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 shadow-sm">
      <dt className="text-sm font-semibold text-neutral-600">{label}</dt>
      <dd className="mt-2 text-3xl font-bold text-neutral-950">{value}</dd>
    </div>
  );
}
