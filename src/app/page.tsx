import Link from "next/link";

import {
  type CollectionSummary,
  type PublicationSummary,
  type PublisherSummary,
  type SubjectSummary,
  toCollectionSummary,
  toPublisherSummary,
  toPublicationSummary,
  toSubjectAuthoritySummary,
} from "@/modules/catalog/application";
import { createCatalogServices } from "@/modules/catalog/interfaces/http/catalog-services";

import { PageHero } from "./page-hero";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { collectionService, publicationService, publisherService, subjectService } =
    await createCatalogServices();
  const [publishers, featuredCollections, subjects, recentPublications] = await Promise.all([
    publisherService.listPublishers({ page: 1, pageSize: 5 }),
    collectionService.listCollections({ page: 1, pageSize: 3 }),
    subjectService.listSubjects({ page: 1, pageSize: 8 }),
    publicationService.listRecentPublications({ limit: 13 }),
  ]);
  const publisherSummaries = publishers.data.map(toPublisherSummary);
  const collectionSummaries = featuredCollections.data.map((profile) =>
    toCollectionSummary(profile.collection, profile.publications.length),
  );
  const subjectSummaries = subjects.data.map((profile) =>
    toSubjectAuthoritySummary(profile.subject, profile.publications.length),
  );
  const recentSummaries = recentPublications.map(toPublicationSummary);

  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Punto de acceso público a la producción editorial universitaria cubana, organizado por editoriales, colecciones, autores, materias y recursos digitales verificables."
        eyebrow="Plataforma nacional"
        title="Catálogo nacional de editoriales universitarias"
      />

      <section className="border-b border-slate-200 bg-white" aria-label="Estructura del catálogo">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-5 sm:px-6 md:grid-cols-5">
          <StructureLink
            description="Obras académicas, libros, folletos y memorias con metadatos normalizados."
            href="/publicaciones"
            label="Publicaciones"
          />
          <StructureLink
            description="Sellos universitarios integrados a la red nacional y sus catálogos."
            href="/editoriales"
            label="Editoriales"
          />
          <StructureLink
            description="Series y agrupaciones editoriales para organizar la producción."
            href="/colecciones"
            label="Colecciones"
          />
          <StructureLink
            description="Autorías, contribuciones, afiliaciones y vínculos con obras publicadas."
            href="/autores"
            label="Autores"
          />
          <StructureLink
            description="Autoridades temáticas para mejorar búsqueda, navegación y SEO."
            href="/materias"
            label="Materias"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:py-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <SectionHeader
            eyebrow="Catálogo nacional"
            href="/publicaciones"
            linkLabel="Ver todas"
            title="Publicaciones recientes"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {recentSummaries.map((publication) => (
              <PublicationCard key={publication.id} publication={publication} />
            ))}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-normal text-blue-800">
                  Red editorial
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-950">Editoriales integradas</h2>
              </div>
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-950">
                {publishers.pagination.total}
              </span>
            </div>
            <ul className="mt-4 grid gap-3">
              {publisherSummaries.map((publisher) => (
                <PublisherLink key={publisher.id} publisher={publisher} />
              ))}
            </ul>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-normal text-blue-800">Autoridades</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950">Materias principales</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {subjectSummaries.map((subject) => (
                <SubjectChip key={subject.identifier} subject={subject} />
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
          <SectionHeader
            eyebrow="Organización editorial"
            href="/colecciones"
            linkLabel="Ver colecciones"
            title="Colecciones activas"
          />
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {collectionSummaries.map((collection) => (
              <CollectionCard collection={collection} key={collection.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          <ProcessPanel
            label="Fuente descriptiva"
            title="Omeka S"
            value="Metadatos, recursos digitales, colecciones y relaciones editoriales."
          />
          <ProcessPanel
            label="Experiencia pública"
            title="Portal PNPU"
            value="Navegación, fichas, filtros, SEO y consulta unificada de la red."
          />
          <ProcessPanel
            label="Gobernanza"
            title="Reduniv"
            value="Identidad institucional, acceso seguro y coordinación nacional."
          />
        </div>
      </section>
    </main>
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
  readonly href: string;
  readonly linkLabel: string;
  readonly title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-normal text-blue-800">{eyebrow}</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950 sm:text-2xl">{title}</h2>
      </div>
      <Link className="text-sm font-bold text-blue-800 hover:text-blue-950" href={href}>
        {linkLabel}
      </Link>
    </div>
  );
}

function PublicationCard({ publication }: { readonly publication: PublicationSummary }) {
  const typePresentation = getPublicationTypePresentation(publication.type);
  const TypeIcon = typePresentation.Icon;

  return (
    <article className="grid min-h-56 grid-cols-1 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm sm:grid-cols-[7rem_minmax(0,1fr)]">
      <div
        className={`flex min-h-24 flex-row items-center justify-center gap-3 p-3 text-center text-white sm:h-full sm:flex-col sm:gap-0 ${typePresentation.accentClass}`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/15 sm:h-14 sm:w-14">
          <TypeIcon />
        </span>
        <span className="max-w-40 text-xs font-bold uppercase tracking-normal text-white/90 sm:mt-3">
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
  readonly accentClass: string;
  readonly Icon: () => React.JSX.Element;
  readonly label: string;
}

function getPublicationTypePresentation(type: string): PublicationTypePresentation {
  const normalizedType = type.trim();

  if (normalizedType === "book") {
    return {
      accentClass: "bg-gradient-to-br from-blue-700 to-blue-950",
      Icon: BookIcon,
      label: "Libro",
    };
  }

  if (normalizedType === "ebook") {
    return {
      accentClass: "bg-gradient-to-br from-cyan-700 to-blue-950",
      Icon: EbookIcon,
      label: "Libro digital",
    };
  }

  if (normalizedType === "manual") {
    return {
      accentClass: "bg-gradient-to-br from-emerald-700 to-blue-950",
      Icon: ManualIcon,
      label: "Manual",
    };
  }

  if (normalizedType === "monograph") {
    return {
      accentClass: "bg-gradient-to-br from-slate-700 to-blue-950",
      Icon: MonographIcon,
      label: "Monografía",
    };
  }

  if (normalizedType === "conferenceProceedings") {
    return {
      accentClass: "bg-gradient-to-br from-amber-700 to-blue-950",
      Icon: ProceedingsIcon,
      label: "Memorias",
    };
  }

  if (normalizedType === "technicalReport") {
    return {
      accentClass: "bg-gradient-to-br from-zinc-700 to-blue-950",
      Icon: ReportIcon,
      label: "Informe técnico",
    };
  }

  if (normalizedType === "dataset") {
    return {
      accentClass: "bg-gradient-to-br from-teal-700 to-blue-950",
      Icon: DatasetIcon,
      label: "Datos",
    };
  }

  if (normalizedType === "openEducationalResource") {
    return {
      accentClass: "bg-gradient-to-br from-green-700 to-blue-950",
      Icon: OpenResourceIcon,
      label: "Recurso educativo",
    };
  }

  if (normalizedType === "podcast") {
    return {
      accentClass: "bg-gradient-to-br from-indigo-700 to-blue-950",
      Icon: PodcastIcon,
      label: "Podcast",
    };
  }

  if (normalizedType === "video") {
    return {
      accentClass: "bg-gradient-to-br from-red-700 to-blue-950",
      Icon: VideoIcon,
      label: "Video",
    };
  }

  if (normalizedType === "thesis") {
    return {
      accentClass: "bg-gradient-to-br from-violet-700 to-blue-950",
      Icon: ThesisIcon,
      label: "Tesis",
    };
  }

  if (normalizedType === "journal") {
    return {
      accentClass: "bg-gradient-to-br from-sky-700 to-blue-950",
      Icon: JournalIcon,
      label: "Revista",
    };
  }

  if (normalizedType === "bookChapter") {
    return {
      accentClass: "bg-gradient-to-br from-orange-700 to-blue-950",
      Icon: ChapterIcon,
      label: "Capítulo",
    };
  }

  return {
    accentClass: "bg-gradient-to-br from-slate-700 to-blue-950",
    Icon: PublicationIcon,
    label: formatPublicationType(type),
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

function PublisherLink({ publisher }: { readonly publisher: PublisherSummary }) {
  return (
    <li>
      <Link
        className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 rounded-md border border-slate-100 p-2 hover:border-blue-200 hover:bg-blue-50"
        href={`/editoriales/${publisher.id}`}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-950 text-sm font-bold text-white">
          {getInitials(publisher.acronym ?? publisher.officialName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-slate-950">
            {publisher.acronym ?? publisher.officialName}
          </span>
          <span className="block truncate text-xs text-slate-500">{publisher.country}</span>
        </span>
      </Link>
    </li>
  );
}

function SubjectChip({ subject }: { readonly subject: SubjectSummary }) {
  return (
    <Link
      className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-950"
      href={`/materias/${encodeURIComponent(subject.identifier)}`}
    >
      {subject.preferredLabel}
    </Link>
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

function ProcessPanel({
  label,
  title,
  value,
}: {
  readonly label: string;
  readonly title: string;
  readonly value: string;
}) {
  return (
    <section className="border-l-4 border-blue-800 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-normal text-blue-800">{label}</p>
      <h2 className="mt-2 text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{value}</p>
    </section>
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
