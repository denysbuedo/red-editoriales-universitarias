import {
  Collection,
  Contributor,
  Identifier,
  LanguageCode,
  Orcid,
  PnpuUuid,
  Publication,
  Publisher,
  Resource,
  Subject,
  University,
} from "../../domain";

export function createSampleCatalogData(): {
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

  return {
    collections: [collection],
    contributors: [contributor],
    publications: [publication],
    publishers: [publisher],
    subjects: [subject],
  };
}
