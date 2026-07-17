import { describe, expect, it } from "vitest";

import { createSampleCatalogData } from "../../infrastructure";
import {
  toCollectionDetail,
  toCollectionSummary,
  toContributorAuthoritySummary,
  toContributorDetail,
  toPublicationDetail,
  toPublicationSummary,
  toPublisherDetail,
  toPublisherSummary,
  toSubjectAuthoritySummary,
  toSubjectDetail,
} from ".";

describe("catalog mappers", () => {
  it("maps publication summary and detail DTOs", () => {
    const { publications } = createSampleCatalogData();
    const publication = publications[0];

    expect(toPublicationSummary(publication)).toEqual({
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
      title: "Arquitectura empresarial para universidades",
      subtitle: "Gobierno, integración y sostenibilidad tecnológica",
      publicationDate: "2026-07-14",
      language: "es",
      type: "book",
      license: "CC BY",
      primaryIdentifier: { type: "isbn", value: "9789590000003" },
      subjects: [
        {
          identifier: "unesco:1203",
          preferredLabel: "Ciencia de los ordenadores",
          uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
        },
      ],
      keywords: ["arquitectura empresarial", "universidades", "gobierno de datos"],
      publisher: {
        id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
        officialName: "Editorial Universidad de La Habana",
        acronym: "Editorial UH",
        country: "CU",
      },
    });
    expect(toPublicationDetail(publication)).toMatchObject({
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
      subtitle: "Gobierno, integración y sostenibilidad tecnológica",
      license: "CC BY",
      format: "application/pdf",
      collection: {
        id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08",
        title: "Arquitectura y gobierno universitario",
        collectionCode: "UH-AGU",
        editorialSeries: "Gestión universitaria",
      },
      contributors: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01",
          name: "Juana Perez Rodriguez",
          roles: ["author"],
          orcid: "https://orcid.org/0000-0002-1825-0097",
        },
      ],
      identifiers: [{ type: "isbn", value: "9789590000003" }],
      subjects: [
        {
          identifier: "unesco:1203",
          preferredLabel: "Ciencia de los ordenadores",
          uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
        },
      ],
      resources: [
        {
          type: "pdf",
          format: "application/pdf",
          fileSize: 2457600,
          checksum: "d41d8cd98f00b204e9800998ecf8427e",
          language: "es",
          license: "CC BY",
        },
      ],
      keywords: ["arquitectura empresarial", "universidades", "gobierno de datos"],
    });
  });

  it("maps publisher summary and detail DTOs", () => {
    const { publishers } = createSampleCatalogData();
    const publisher = publishers[0];

    expect(toPublisherSummary(publisher)).toEqual({
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
      officialName: "Editorial Universidad de La Habana",
      acronym: "Editorial UH",
      country: "CU",
    });
    expect(toPublisherDetail(publisher)).toMatchObject({
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
      acronym: "Editorial UH",
      publisherCode: "RNEU-UH",
      province: "La Habana",
      website: "https://www.uh.cu/editorial",
      contactPoint: {
        email: "editorial@uh.cu",
        telephone: "+53 7 000 0000",
        url: "https://www.uh.cu/editorial",
      },
      university: {
        id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c02",
        officialName: "Universidad de La Habana",
        acronym: "UH",
        province: "La Habana",
        country: "CU",
        website: "https://www.uh.cu/",
      },
    });
  });

  it("maps contributor authority DTOs", () => {
    const { contributors, publications } = createSampleCatalogData();
    const contributor = contributors[0];

    expect(toContributorAuthoritySummary(contributor, publications.length)).toMatchObject({
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01",
      name: "Juana Perez Rodriguez",
      givenName: "Juana",
      familyName: "Perez Rodriguez",
      roles: ["author"],
      orcid: "https://orcid.org/0000-0002-1825-0097",
      affiliation: "Universidad de La Habana",
      country: "CU",
      publicationCount: 1,
    });
    expect(toContributorDetail(contributor, publications)).toMatchObject({
      biography:
        "Investigadora vinculada a la gestion de informacion, arquitectura empresarial y gobierno de datos en instituciones universitarias.",
      publications: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
        },
      ],
    });
  });

  it("maps subject authority DTOs", () => {
    const { publications, subjects } = createSampleCatalogData();
    const subject = subjects[0];

    expect(toSubjectAuthoritySummary(subject, publications.length)).toEqual({
      identifier: "unesco:1203",
      preferredLabel: "Ciencia de los ordenadores",
      uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
      broader: undefined,
      related: undefined,
      publicationCount: 1,
    });
    expect(toSubjectDetail(subject, publications)).toMatchObject({
      identifier: "unesco:1203",
      publications: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
          title: "Arquitectura empresarial para universidades",
        },
      ],
    });
  });

  it("maps collection DTOs", () => {
    const { collections, publications } = createSampleCatalogData();
    const collection = collections[0];

    expect(toCollectionSummary(collection, publications.length)).toMatchObject({
      id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08",
      title: "Arquitectura y gobierno universitario",
      collectionCode: "UH-AGU",
      editorialSeries: "Gestión universitaria",
      publicationCount: 1,
    });
    expect(toCollectionDetail(collection, publications)).toMatchObject({
      publications: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
        },
      ],
    });
  });
});
