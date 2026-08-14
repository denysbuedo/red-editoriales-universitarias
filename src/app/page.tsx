import Link from "next/link";

import {
  type CollectionSummary,
  type PublicationSummary,
  type PublisherSummary,
  toCollectionSummary,
  toPublisherSummary,
  toPublicationSummary,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

import { PageHero } from "./page-hero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { collectionService, publicationService, publisherService } = await createCatalogServices();
  const [publishers, featuredCollections, recentPublications] = await Promise.all([
    publisherService.listPublishers({ page: 1, pageSize: 5 }),
    collectionService.listCollections({ page: 1, pageSize: 3 }),
    publicationService.listRecentPublications({ limit: 13 }),
  ]);
  const publisherSummaries = publishers.data.map(toPublisherSummary);
  const collectionSummaries = featuredCollections.data.map((profile) =>
    toCollectionSummary(profile.collection, profile.publications.length),
  );
  const recentSummaries = recentPublications.map(toPublicationSummary);

  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Acceso nacional a libros, folletos, memorias, manuales y otras publicaciones producidas por las editoriales universitarias cubanas."
        eyebrow="EDUNIV"
        title="Catálogo de la Red de Editoriales Universitarias Cubanas"
      >
        <CatalogSearch />
      </PageHero>

      <section className="border-b border-slate-200 bg-white" aria-label="Accesos al catálogo">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-5">
          <StructureLink
            description="Libros, folletos, memorias y otras obras editoriales universitarias."
            href="/publicaciones"
            label="Publicaciones"
          />
          <StructureLink
            description="Sellos universitarios integrados a la red nacional EDUNIV."
            href="/editoriales"
            label="Editoriales"
          />
          <StructureLink
            description="Series y agrupaciones que organizan la producción editorial."
            href="/colecciones"
            label="Colecciones"
          />
          <StructureLink
            description="Autorías, editorías y contribuciones asociadas a las obras."
            href="/autores"
            label="Autores"
          />
          <StructureLink
            description="Temas y áreas de conocimiento para explorar el catálogo."
            href="/materias"
            label="Materias"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <div className="min-h-[4.25rem]">
            <SectionHeader eyebrow="Novedades" title="Publicaciones recientes" />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recentSummaries.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        </div>

        <aside className="content-start">
          <div className="min-h-[4.25rem]">
            <SectionHeader eyebrow="Directorio editorial" title="Red de Editoriales" />
          </div>
          <div className="mt-5 grid gap-3">
            {publisherSummaries.map((publisher) => (
              <PublisherCard key={publisher.id} publisher={publisher} />
            ))}
          </div>
        </aside>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
          <SectionHeader eyebrow="Organización editorial" title="Colecciones destacadas" />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {collectionSummaries.map((collection) => (
              <CollectionCard collection={collection} key={collection.id} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CatalogSearch() {
  return (
    <form
      action="/publicaciones"
      className="grid max-w-3xl gap-3 rounded-md border border-white/20 bg-white p-3 shadow-lg sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <label className="sr-only" htmlFor="home-catalog-search">
        Buscar en el catálogo EDUNIV
      </label>
      <input
        className="min-h-12 w-full rounded-md border border-slate-300 px-4 text-base text-slate-950 placeholder:text-slate-500"
        id="home-catalog-search"
        name="q"
        placeholder="Buscar por título, autor, editorial, ISBN o materia"
        type="search"
      />
      <button
        className="min-h-12 rounded-md bg-blue-950 px-5 text-sm font-bold text-white hover:bg-blue-900"
        type="submit"
      >
        Buscar
      </button>
    </form>
  );
}

function StructureLink({
  description,
  href,
  label,
}: {
  readonly description: string;
  readonly href: string;
  readonly label: string;
}) {
  return (
    <Link
      className="group rounded-md border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50"
      href={href}
    >
      <span className="text-sm font-bold text-blue-950 group-hover:text-blue-800">{label}</span>
      <span className="mt-2 block text-sm leading-6 text-slate-600">{description}</span>
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  href,
  linkLabel,
  title,
}: {
  readonly eyebrow: string;
  readonly href?: string;
  readonly linkLabel?: string;
  readonly title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-normal text-blue-800">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950 sm:whitespace-nowrap sm:text-2xl">
          {title}
        </h2>
      </div>
      {href === undefined || linkLabel === undefined ? null : (
        <Link className="text-sm font-bold text-blue-800 hover:text-blue-950" href={href}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function PublicationCard({ publication }: { readonly publication: PublicationSummary }) {
  const typePresentation = getPublicationTypePresentation(publication.type);
  const TypeIcon = typePresentation.Icon;

  return (
    <article className="grid min-h-56 grid-cols-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm sm:grid-cols-[7rem_minmax(0,1fr)]">
      <div
        className={`flex min-h-24 flex-row items-center justify-center gap-3 border-b p-3 text-center sm:h-full sm:flex-col sm:gap-0 sm:border-b-0 sm:border-r ${typePresentation.panelClass}`}
      >
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border bg-white sm:h-14 sm:w-14 ${typePresentation.iconClass}`}
        >
          <TypeIcon />
        </span>
        <span className="max-w-40 text-xs font-bold uppercase tracking-normal sm:mt-3">
          {typePresentation.label}
        </span>
      </div>
      <div className="min-w-0 p-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
          {publication.publicationDate} ·{" "}
          {publication.publisher.acronym ?? publication.publisher.officialName}
        </p>
        <h3 className="mt-2 break-words text-base font-bold leading-snug text-slate-950 sm:text-lg">
          <Link className="hover:text-blue-800" href={`/publicaciones/${publication.id}`}>
            {publication.title}
          </Link>
        </h3>
        {publication.subtitle === undefined ? null : (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {publication.subtitle}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {publication.primaryIdentifier === undefined ? null : (
            <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {publication.primaryIdentifier.type.toUpperCase()}:{" "}
              {publication.primaryIdentifier.value}
            </span>
          )}
          {publication.subjects.slice(0, 2).map((subject) => (
            <span
              className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-950"
              key={subject.identifier}
            >
              {subject.preferredLabel}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

interface PublicationTypePresentation {
  readonly Icon: () => React.JSX.Element;
  readonly iconClass: string;
  readonly label: string;
  readonly panelClass: string;
}

function getPublicationTypePresentation(type: string): PublicationTypePresentation {
  const normalizedType = type.trim();

  if (normalizedType === "book") {
    return {
      Icon: BookIcon,
      iconClass: "border-blue-200 text-blue-900",
      label: "Libro",
      panelClass: "border-blue-100 bg-blue-50 text-blue-950",
    };
  }

  if (normalizedType === "ebook") {
    return {
      Icon: EbookIcon,
      iconClass: "border-cyan-200 text-cyan-900",
      label: "Libro digital",
      panelClass: "border-cyan-100 bg-cyan-50 text-cyan-950",
    };
  }

  if (normalizedType === "manual") {
    return {
      Icon: ManualIcon,
      iconClass: "border-emerald-200 text-emerald-900",
      label: "Manual",
      panelClass: "border-emerald-100 bg-emerald-50 text-emerald-950",
    };
  }

  if (normalizedType === "monograph") {
    return {
      Icon: MonographIcon,
      iconClass: "border-slate-200 text-slate-800",
      label: "Monografía",
      panelClass: "border-slate-100 bg-slate-50 text-slate-800",
    };
  }

  if (normalizedType === "conferenceProceedings") {
    return {
      Icon: ProceedingsIcon,
      iconClass: "border-amber-200 text-amber-900",
      label: "Memorias",
      panelClass: "border-amber-100 bg-amber-50 text-amber-950",
    };
  }

  if (normalizedType === "technicalReport") {
    return {
      Icon: ReportIcon,
      iconClass: "border-zinc-200 text-zinc-800",
      label: "Informe técnico",
      panelClass: "border-zinc-100 bg-zinc-50 text-zinc-800",
    };
  }

  if (normalizedType === "dataset") {
    return {
      Icon: DatasetIcon,
      iconClass: "border-teal-200 text-teal-900",
      label: "Datos",
      panelClass: "border-teal-100 bg-teal-50 text-teal-950",
    };
  }

  if (normalizedType === "openEducationalResource") {
    return {
      Icon: OpenResourceIcon,
      iconClass: "border-green-200 text-green-900",
      label: "Recurso educativo",
      panelClass: "border-green-100 bg-green-50 text-green-950",
    };
  }

  if (normalizedType === "podcast") {
    return {
      Icon: PodcastIcon,
      iconClass: "border-indigo-200 text-indigo-900",
      label: "Podcast",
      panelClass: "border-indigo-100 bg-indigo-50 text-indigo-950",
    };
  }

  if (normalizedType === "video") {
    return {
      Icon: VideoIcon,
      iconClass: "border-rose-200 text-rose-900",
      label: "Video",
      panelClass: "border-rose-100 bg-rose-50 text-rose-950",
    };
  }

  if (normalizedType === "thesis") {
    return {
      Icon: ThesisIcon,
      iconClass: "border-violet-200 text-violet-900",
      label: "Tesis",
      panelClass: "border-violet-100 bg-violet-50 text-violet-950",
    };
  }

  if (normalizedType === "journal") {
    return {
      Icon: JournalIcon,
      iconClass: "border-sky-200 text-sky-900",
      label: "Revista",
      panelClass: "border-sky-100 bg-sky-50 text-sky-950",
    };
  }

  if (normalizedType === "bookChapter") {
    return {
      Icon: ChapterIcon,
      iconClass: "border-orange-200 text-orange-900",
      label: "Capítulo",
      panelClass: "border-orange-100 bg-orange-50 text-orange-950",
    };
  }

  return {
    Icon: PublicationIcon,
    iconClass: "border-slate-200 text-slate-800",
    label: formatPublicationType(type),
    panelClass: "border-slate-100 bg-slate-50 text-slate-800",
  };
}

function formatPublicationType(type: string): string {
  const normalizedType = type.trim();

  if (normalizedType.length === 0) {
    return "Publicación";
  }

  return normalizedType.replace(/([a-z])([A-Z])/gu, "$1 $2");
}

function BookIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 4.5h9a3 3 0 0 1 3 3v12h-9a3 3 0 0 0-3 3z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 4.5v15a3 3 0 0 1 3-3h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EbookIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <rect height="17" rx="2" stroke="currentColor" strokeWidth="1.8" width="12" x="6" y="3.5" />
      <path
        d="M9 7h6M9 10h6M10.5 17h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ManualIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 4h11a2 2 0 0 1 2 2v14H8a3 3 0 0 1-3-3V5a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 8h6M9 11h5M9 14h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MonographIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path d="M7 3.5h8l3 3v14H7z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path
        d="M15 3.5v3h3M9.5 11h5M9.5 14h5M9.5 17h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ProceedingsIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 20V8l5-4 5 4v12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 20h14M9 12h6M9 15h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ReportIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M6.5 4h8l3 3v13h-11z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M14.5 4v3h3M9 11h6M9 14h6M9 17h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function DatasetIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <ellipse cx="12" cy="6" rx="6" ry="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M6 6v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V6M6 12v6c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function OpenResourceIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 4a6 6 0 0 0-6 6v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M6 13h9a3 3 0 0 1 0 6H6zM14 10h4V6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PodcastIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 13.5a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v3.5a3 3 0 0 0 3 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M6.5 10.5a5.5 5.5 0 0 0 11 0M12 16v4M9 20h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <rect height="12" rx="2" stroke="currentColor" strokeWidth="1.8" width="15" x="4" y="6" />
      <path d="m10 9.5 4 2.5-4 2.5z" fill="currentColor" />
    </svg>
  );
}

function ThesisIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="m4 8 8-4 8 4-8 4zM7 10.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3v-4.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M20 8v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 5h11a1 1 0 0 1 1 1v14H7a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M8.5 8.5h6M8.5 12h6M8.5 15.5h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function ChapterIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 5h8a3 3 0 0 1 3 3v11H8a3 3 0 0 0-3 3z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M9 9h4M9 12h4M18 7h1.5M18 11h1.5M18 15h1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PublicationIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8" fill="none" viewBox="0 0 24 24">
      <path d="M7 4h8l3 3v13H7z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path
        d="M15 4v3h3M9.5 12h5M9.5 15h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PublisherCard({ publisher }: { readonly publisher: PublisherSummary }) {
  return (
    <article className="overflow-hidden rounded-md border border-sky-200 bg-white shadow-sm">
      <div className="border-b border-sky-500 bg-sky-700 px-4 py-2 text-xs font-bold uppercase tracking-normal text-white">
        Editorial universitaria
      </div>
      <Link
        className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 bg-sky-50 px-4 py-4 hover:text-sky-950"
        href={`/editoriales/${publisher.id}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-md border border-sky-300 bg-white text-sm font-bold text-sky-950 shadow-sm">
          {getInitials(publisher.acronym ?? publisher.officialName)}
        </span>
        <span className="min-w-0">
          <span className="block break-words text-base font-bold leading-snug text-slate-950">
            {publisher.officialName}
          </span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-normal text-slate-500">
            {publisher.acronym ?? "Editorial"} · {publisher.country}
          </span>
        </span>
      </Link>
      <div className="px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-sky-800">
          Registro editorial
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Editorial universitaria integrada a la red nacional EDUNIV.
        </p>
        <Link
          className="mt-4 inline-flex text-sm font-bold text-blue-800 hover:text-blue-950"
          href={`/editoriales/${publisher.id}`}
        >
          Ver ficha
        </Link>
      </div>
    </article>
  );
}

function CollectionCard({ collection }: { readonly collection: CollectionSummary }) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-normal text-blue-800">
        {collection.publisher.acronym ?? collection.publisher.officialName}
      </p>
      <h3 className="mt-2 text-lg font-bold text-slate-950">
        <Link className="hover:text-blue-800" href={`/colecciones/${collection.id}`}>
          {collection.title}
        </Link>
      </h3>
      {collection.description === undefined ? null : (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
          {collection.description}
        </p>
      )}
      <p className="mt-4 text-sm font-semibold text-slate-700">
        {collection.publicationCount} publicaciones
      </p>
    </article>
  );
}

function getInitials(value: string): string {
  return value
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
