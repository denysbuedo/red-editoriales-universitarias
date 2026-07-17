import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import {
  toCollectionSummary,
  toContributorAuthoritySummary,
  toPublisherSummary,
  toPublicationSummary,
  toSubjectAuthoritySummary,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

interface PublicationsPageProps {
  readonly searchParams?: Promise<Record<string, string | readonly string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Publicaciones | PNPU",
  description: "Catálogo público de publicaciones universitarias integradas en la PNPU.",
};

export default async function PublicationsPage({ searchParams }: PublicationsPageProps = {}) {
  const params = await searchParams;
  const filters = readFilters(params);
  const page = readPage(params);
  const {
    collectionService,
    contributorService,
    publicationService,
    publisherService,
    subjectService,
  } = await createCatalogServices();
  const [publications, publishers, subjects, contributors, collections] = await Promise.all([
    publicationService.listPublications({
      page,
      pageSize: 20,
      ...filters,
    }),
    publisherService.listPublishers({ page: 1, pageSize: 100 }),
    subjectService.listSubjects({ page: 1, pageSize: 100 }),
    contributorService.listContributors({ page: 1, pageSize: 100 }),
    collectionService.listCollections({ page: 1, pageSize: 100 }),
  ]);
  const summaries = publications.data.map(toPublicationSummary);
  const publisherOptions = publishers.data.map(toPublisherSummary);
  const subjectOptions = subjects.data.map((profile) =>
    toSubjectAuthoritySummary(profile.subject, profile.publications.length),
  );
  const contributorOptions = contributors.data.map((profile) =>
    toContributorAuthoritySummary(profile.contributor, profile.publications.length),
  );
  const collectionOptions = collections.data.map((profile) =>
    toCollectionSummary(profile.collection, profile.publications.length),
  );

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
        PNPU
      </Link>
      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">Catálogo</p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950 md:text-4xl">
          Publicaciones universitarias
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Obras editoriales universitarias integradas por la Plataforma Nacional de Publicaciones
          Universitarias.
        </p>
      </header>

      <form
        action="/publicaciones"
        className="mt-8 grid gap-4 border-b border-neutral-200 pb-6 md:grid-cols-2 xl:grid-cols-4"
      >
        <label className="grid min-w-0 gap-1 text-sm font-medium text-neutral-800 md:col-span-2">
          Buscar
          <input
            className="h-10 w-full min-w-0 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
            defaultValue={filters.q}
            name="q"
            placeholder="Titulo, autor, ISBN, materia"
            type="search"
          />
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-neutral-800">
          Editorial
          <select
            className="h-10 w-full min-w-0 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
            defaultValue={filters.publisherId ?? ""}
            name="publisherId"
          >
            <option value="">Todos</option>
            {publisherOptions.map((publisher) => (
              <option key={publisher.id} value={publisher.id}>
                {publisher.acronym ?? publisher.officialName}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-neutral-800">
          Materia
          <select
            className="h-10 w-full min-w-0 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
            defaultValue={filters.subject ?? ""}
            name="subject"
          >
            <option value="">Todas</option>
            {subjectOptions.map((subject) => (
              <option key={subject.identifier} value={subject.identifier}>
                {subject.preferredLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-neutral-800">
          Autor
          <select
            className="h-10 w-full min-w-0 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
            defaultValue={filters.contributorId ?? ""}
            name="contributorId"
          >
            <option value="">Todos</option>
            {contributorOptions.map((contributor) => (
              <option key={contributor.id} value={contributor.id}>
                {contributor.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-neutral-800">
          Colección
          <select
            className="h-10 w-full min-w-0 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
            defaultValue={filters.collectionId ?? ""}
            name="collectionId"
          >
            <option value="">Todas</option>
            {collectionOptions.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {formatCollectionOption(collection)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-neutral-800">
          Idioma
          <select
            className="h-10 w-full min-w-0 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
            defaultValue={filters.language ?? ""}
            name="language"
          >
            <option value="">Todos</option>
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="fr">Francés</option>
          </select>
        </label>
        <label className="grid min-w-0 gap-1 text-sm font-medium text-neutral-800">
          Orden
          <select
            className="h-10 w-full min-w-0 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
            defaultValue={filters.sort ?? "publicationDateDesc"}
            name="sort"
          >
            <option value="publicationDateDesc">Más recientes</option>
            <option value="publicationDateAsc">Más antiguas</option>
            <option value="titleAsc">Título A-Z</option>
            <option value="titleDesc">Título Z-A</option>
            <option value="publisherAsc">Editorial A-Z</option>
          </select>
        </label>
        <div className="flex min-w-0 items-end gap-2">
          <button
            className="h-10 rounded-md bg-green-900 px-4 text-sm font-semibold text-white hover:bg-green-950"
            type="submit"
          >
            Filtrar
          </button>
          <Link
            className="inline-flex h-10 items-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            href="/publicaciones"
          >
            Limpiar
          </Link>
        </div>
      </form>

      <section className="mt-8" aria-label="Listado de publicaciones">
        <div className="mb-4 flex flex-col gap-3 text-sm text-neutral-600 md:flex-row md:items-center md:justify-between">
          <p>
            {publications.pagination.total} resultado
            {publications.pagination.total === 1 ? "" : "s"}
          </p>
          {publications.pagination.totalPages > 1 ? (
            <p>
              Página {publications.pagination.page} de {publications.pagination.totalPages}
            </p>
          ) : null}
        </div>
        {summaries.length === 0 ? (
          <div className="rounded-md border border-neutral-200 bg-neutral-50 p-6">
            <h2 className="text-base font-semibold text-neutral-950">Sin resultados</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              No hay publicaciones que coincidan con los filtros aplicados.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {summaries.map((publication) => (
              <article
                className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
                key={publication.id}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-sm text-neutral-600">
                      <Link
                        className="font-medium text-green-800 hover:text-green-950"
                        href={`/editoriales/${publication.publisher.id}`}
                      >
                        {publication.publisher.officialName}
                      </Link>
                      <span>{publication.publicationDate}</span>
                      <span>{publication.language.toUpperCase()}</span>
                      <span>{publication.type}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-neutral-950">
                      <Link
                        className="hover:text-green-800"
                        href={`/publicaciones/${publication.id}`}
                      >
                        {publication.title}
                      </Link>
                    </h2>
                    {publication.subtitle ? (
                      <p className="mt-1 text-base text-neutral-700">{publication.subtitle}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-neutral-700">
                      {publication.license ? (
                        <span className="rounded-md bg-green-50 px-2 py-1 text-green-900">
                          {publication.license}
                        </span>
                      ) : null}
                      {publication.primaryIdentifier ? (
                        <span className="rounded-md bg-neutral-100 px-2 py-1">
                          {publication.primaryIdentifier.type.toUpperCase()}:{" "}
                          {publication.primaryIdentifier.value}
                        </span>
                      ) : null}
                    </div>
                    {publication.subjects.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2" aria-label="Materias">
                        {publication.subjects.map((subject) => (
                          <Link
                            className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-200"
                            href={`/materias/${encodeURIComponent(subject.identifier)}`}
                            key={subject.identifier}
                          >
                            {subject.preferredLabel}
                          </Link>
                        ))}
                      </div>
                    ) : null}
                    {publication.keywords && publication.keywords.length > 0 ? (
                      <p className="mt-3 text-sm text-neutral-600">
                        Palabras clave: {publication.keywords.join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <Link
                    className="inline-flex rounded-md border border-green-800 px-3 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
                    href={`/publicaciones/${publication.id}`}
                  >
                    Ver ficha
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        <PaginationControls
          currentPage={publications.pagination.page}
          filters={filters}
          totalPages={publications.pagination.totalPages}
        />
      </section>
    </main>
  );
}

interface PublicationPageFilters {
  readonly q?: string;
  readonly language?: string;
  readonly publisherId?: string;
  readonly contributorId?: string;
  readonly collectionId?: string;
  readonly subject?: string;
  readonly sort?: string;
}

function readFilters(
  searchParams: Record<string, string | readonly string[] | undefined> | undefined,
): PublicationPageFilters {
  const params = searchParams ?? {};

  return {
    q: optionalFilterValue(params.q),
    language: optionalFilterValue(params.language),
    publisherId: optionalFilterValue(params.publisherId),
    contributorId: optionalFilterValue(params.contributorId),
    collectionId: optionalFilterValue(params.collectionId),
    subject: optionalFilterValue(params.subject),
    sort: optionalFilterValue(params.sort),
  };
}

function readPage(
  searchParams: Record<string, string | readonly string[] | undefined> | undefined,
): number {
  const value = firstValue(searchParams?.page);

  if (value === undefined) {
    return 1;
  }

  const page = Number(value);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

function firstValue(value: string | readonly string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  return value[0];
}

function optionalFilterValue(value: string | readonly string[] | undefined): string | undefined {
  const selectedValue = firstValue(value)?.trim();

  return selectedValue === undefined || selectedValue.length === 0 ? undefined : selectedValue;
}

function formatCollectionOption(collection: {
  readonly title: string;
  readonly collectionCode?: string;
}): string {
  if (collection.collectionCode === undefined) {
    return collection.title;
  }

  return `${collection.title} (${collection.collectionCode})`;
}

function PaginationControls({
  currentPage,
  filters,
  totalPages,
}: {
  readonly currentPage: number;
  readonly filters: PublicationPageFilters;
  readonly totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildVisiblePages(currentPage, totalPages);

  return (
    <nav
      aria-label="Paginación de publicaciones"
      className="mt-8 flex flex-wrap items-center gap-2"
    >
      <PaginationLink
        disabled={currentPage <= 1}
        href={buildPublicationsHref(filters, currentPage - 1)}
      >
        Anterior
      </PaginationLink>
      {pages.map((page) => (
        <PaginationLink
          current={page === currentPage}
          href={buildPublicationsHref(filters, page)}
          key={page}
        >
          {page}
        </PaginationLink>
      ))}
      <PaginationLink
        disabled={currentPage >= totalPages}
        href={buildPublicationsHref(filters, currentPage + 1)}
      >
        Siguiente
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  children,
  current = false,
  disabled = false,
  href,
}: {
  readonly children: ReactNode;
  readonly current?: boolean;
  readonly disabled?: boolean;
  readonly href: string;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-9 items-center rounded-md border border-neutral-200 px-3 text-sm font-medium text-neutral-400">
        {children}
      </span>
    );
  }

  return (
    <Link
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "inline-flex h-9 items-center rounded-md bg-green-900 px-3 text-sm font-semibold text-white"
          : "inline-flex h-9 items-center rounded-md border border-neutral-300 px-3 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
      }
      href={href}
    >
      {children}
    </Link>
  );
}

function buildVisiblePages(currentPage: number, totalPages: number): readonly number[] {
  const first = Math.max(1, currentPage - 2);
  const last = Math.min(totalPages, currentPage + 2);
  const pages: number[] = [];

  for (let page = first; page <= last; page += 1) {
    pages.push(page);
  }

  return pages;
}

function buildPublicationsHref(filters: PublicationPageFilters, page: number): string {
  const params = new URLSearchParams();

  appendParam(params, "q", filters.q);
  appendParam(params, "publisherId", filters.publisherId);
  appendParam(params, "subject", filters.subject);
  appendParam(params, "contributorId", filters.contributorId);
  appendParam(params, "collectionId", filters.collectionId);
  appendParam(params, "language", filters.language);
  appendParam(params, "sort", filters.sort);

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query.length === 0 ? "/publicaciones" : `/publicaciones?${query}`;
}

function appendParam(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value !== undefined && value.trim().length > 0) {
    params.set(key, value);
  }
}
