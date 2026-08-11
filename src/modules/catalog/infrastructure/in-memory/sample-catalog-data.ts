import {
  Collection,
  Contributor,
  Identifier,
  LanguageCode,
  Orcid,
  PnpuUuid,
  PUBLICATION_TYPES,
  Publication,
  PublicationType,
  Publisher,
  Resource,
  ResourceType,
  Subject,
  University,
} from "../../domain";

export interface SampleCatalogDataOptions {
  readonly includePublicationTypeShowcase?: boolean;
}

export function createSampleCatalogData(options: SampleCatalogDataOptions = {}): {
  readonly contributors: readonly Contributor[];
  readonly collections: readonly Collection[];
  readonly publications: readonly Publication[];
  readonly publishers: readonly Publisher[];
  readonly subjects: readonly Subject[];
} {
  const university = University.create({
    id: PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c02"),
    officialName: "Universidad de La Habana",
    acronym: "UH",
    universityCode: "MES-UH",
    province: "La Habana",
    country: "CU",
    website: "https://www.uh.cu/",
  });
  const publisher = Publisher.create({
    id: PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03"),
    officialName: "Editorial Universidad de La Habana",
    acronym: "Editorial UH",
    publisherCode: "RNEU-UH",
    description:
      "Editorial universitaria orientada a la publicación, preservación y circulación de obras académicas, científicas y docentes de la Universidad de La Habana.",
    university,
    province: "La Habana",
    country: "CU",
    website: "https://www.uh.cu/editorial",
    logo: "https://www.uh.cu/sites/default/files/logo-uh.png",
    contactPoint: {
      email: "editorial@uh.cu",
      telephone: "+53 7 000 0000",
      url: "https://www.uh.cu/editorial",
    },
  });
  const contributor = Contributor.create({
    id: PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01"),
    name: "Juana Perez Rodriguez",
    givenName: "Juana",
    familyName: "Perez Rodriguez",
    roles: ["author"],
    orcid: Orcid.create("0000-0002-1825-0097"),
    affiliation: "Universidad de La Habana",
    biography:
      "Investigadora vinculada a la gestion de informacion, arquitectura empresarial y gobierno de datos en instituciones universitarias.",
    country: "CU",
  });
  const subject = Subject.create({
    identifier: "unesco:1203",
    preferredLabel: "Ciencia de los ordenadores",
    uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
  });
  const collection = Collection.create({
    id: PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08"),
    title: "Arquitectura y gobierno universitario",
    description:
      "Colección editorial dedicada a arquitectura institucional, gobierno de datos e interoperabilidad universitaria.",
    collectionCode: "UH-AGU",
    editorialSeries: "Gestión universitaria",
    publisher,
    subjects: [subject],
  });
  const publication = Publication.create({
    id: PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05"),
    title: "Arquitectura empresarial para universidades",
    subtitle: "Gobierno, integración y sostenibilidad tecnológica",
    abstract:
      "Estudio sobre arquitectura empresarial aplicada a instituciones universitarias, con énfasis en gobierno de datos, interoperabilidad y evolución sostenible de plataformas académicas.",
    publicationDate: "2026-07-14",
    language: LanguageCode.create("es"),
    publisher,
    contributors: [contributor],
    identifiers: [Identifier.create("isbn", "9789590000003")],
    subjects: [subject],
    collection,
    resources: [
      Resource.create({
        type: "pdf",
        url: "https://pnpu.mes.gob.cu/recursos/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05.pdf",
        format: "application/pdf",
        fileSize: 2_457_600,
        checksum: "d41d8cd98f00b204e9800998ecf8427e",
        language: LanguageCode.create("es"),
        license: "CC BY",
      }),
    ],
    type: "book",
    format: "application/pdf",
    license: "CC BY",
    keywords: ["arquitectura empresarial", "universidades", "gobierno de datos"],
  });
  const publications =
    options.includePublicationTypeShowcase === true
      ? [
          publication,
          ...createPublicationTypeShowcase({
            collection,
            contributor,
            publisher,
            subject,
          }),
        ]
      : [publication];

  return {
    collections: [collection],
    contributors: [contributor],
    publications,
    publishers: [publisher],
    subjects: [subject],
  };
}

function createPublicationTypeShowcase({
  collection,
  contributor,
  publisher,
  subject,
}: {
  readonly collection: Collection;
  readonly contributor: Contributor;
  readonly publisher: Publisher;
  readonly subject: Subject;
}): readonly Publication[] {
  const entries: readonly PublicationShowcaseEntry[] = [
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c10",
      identifier: "10.1234/pnpu.ebook.01",
      title: "Guía digital de aprendizaje universitario",
      type: "ebook",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c11",
      identifier: "10.1234/pnpu.manual.01",
      title: "Manual práctico de edición académica",
      type: "manual",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c12",
      identifier: "10.1234/pnpu.monograph.01",
      title: "Monografía sobre gestión del conocimiento",
      type: "monograph",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c13",
      identifier: "10.1234/pnpu.proceedings.01",
      title: "Memorias del seminario de innovación universitaria",
      type: "conferenceProceedings",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c14",
      identifier: "10.1234/pnpu.report.01",
      title: "Informe técnico de interoperabilidad editorial",
      type: "technicalReport",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c15",
      identifier: "10.1234/pnpu.dataset.01",
      title: "Conjunto de datos de producción editorial universitaria",
      type: "dataset",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c16",
      identifier: "10.1234/pnpu.oer.01",
      title: "Recurso educativo abierto para gestión bibliográfica",
      type: "openEducationalResource",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c17",
      identifier: "10.1234/pnpu.podcast.01",
      title: "Podcast sobre edición universitaria cubana",
      type: "podcast",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c18",
      identifier: "10.1234/pnpu.video.01",
      title: "Video docente sobre metadatos editoriales",
      type: "video",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c19",
      identifier: "10.1234/pnpu.thesis.01",
      title: "Tesis doctoral sobre plataformas editoriales",
      type: "thesis",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c1a",
      identifier: "https://pnpu.mes.gob.cu/revistas/0000-0001",
      title: "Revista universitaria de publicaciones académicas",
      type: "journal",
    },
    {
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c1b",
      identifier: "10.1234/pnpu.chapter.01",
      title: "Capítulo sobre preservación digital editorial",
      type: "bookChapter",
    },
  ];

  return entries.map((entry, index) =>
    Publication.create({
      id: PnpuUuid.create(entry.id),
      title: entry.title,
      subtitle: "Registro de demostración para validar la representación visual por tipo",
      abstract:
        "Publicación de prueba utilizada para revisar la presentación visual de tipos documentales en el catálogo PNPU.",
      publicationDate: `2026-08-${String(index + 1).padStart(2, "0")}`,
      language: LanguageCode.create("es"),
      publisher,
      contributors: [contributor],
      identifiers: [Identifier.create(resolveIdentifierType(entry.identifier), entry.identifier)],
      subjects: [subject],
      collection,
      resources: [
        Resource.create({
          type: resolveResourceType(entry.type),
          url: `https://pnpu.mes.gob.cu/recursos/${entry.id}`,
          format: resolveResourceFormat(entry.type),
          language: LanguageCode.create("es"),
          license: "CC BY",
        }),
      ],
      type: entry.type,
      format: resolveResourceFormat(entry.type),
      license: "CC BY",
      keywords: ["demostración", "tipo de publicación", entry.type],
    }),
  );
}

interface PublicationShowcaseEntry {
  readonly id: string;
  readonly identifier: string;
  readonly title: string;
  readonly type: Exclude<PublicationType, "book">;
}

function resolveIdentifierType(identifier: string): "doi" | "isbn" | "uri" {
  if (identifier.startsWith("10.")) {
    return "doi";
  }

  if (identifier.startsWith("978")) {
    return "isbn";
  }

  return "uri";
}

function resolveResourceType(type: PublicationType): ResourceType {
  if (type === "podcast") {
    return "audio";
  }

  if (type === "video") {
    return "video";
  }

  if (type === "dataset") {
    return "externalLink";
  }

  return "pdf";
}

function resolveResourceFormat(type: PublicationType): string {
  if (type === "podcast") {
    return "audio/mpeg";
  }

  if (type === "video") {
    return "video/mp4";
  }

  if (type === "dataset") {
    return "application/json";
  }

  return "application/pdf";
}

export function listSamplePublicationTypes(): readonly PublicationType[] {
  return PUBLICATION_TYPES;
}
