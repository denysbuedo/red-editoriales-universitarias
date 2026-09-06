import { describe, expect, it } from "vitest";
import { Contributor, Publisher, Subject, University } from "../../domain";
import { LanguageCode, PnpuUuid } from "../../domain/value-objects";
import { OmekaJsonObject } from "./omeka-api-client";
import { mapOmekaDigitalResource, mapOmekaPublication } from "./omeka-pnpu-publication-mapper";
import { OmekaQualityReport } from "./omeka-quality-report";

describe("omeka-pnpu-publication-mapper", () => {
  it("maps a complete PNPU Publication with linked references and media", () => {
    const quality = new OmekaQualityReport();
    const university = University.create({
      id: PnpuUuid.create("01990f5a-0000-7000-8000-000000000101"),
      officialName: "Universidad de La Habana",
      country: "CU",
    });
    const publisher = Publisher.create({
      id: PnpuUuid.create("01990f5a-0000-7000-8000-000000000102"),
      officialName: "Editorial UH",
      university,
      country: "CU",
    });
    const contributor = Contributor.create({
      id: PnpuUuid.create("01990f5a-0000-7000-8000-000000000103"),
      name: "Ana Perez",
      roles: ["author"],
    });
    const subject = Subject.create({
      identifier: "37.01",
      preferredLabel: "Educacion superior",
    });
    const publication = mapOmekaPublication(
      resource(100, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000104"),
        "dcterms:title": literals("Gestion editorial universitaria"),
        "dcterms:abstract": literals("Resumen de gestion editorial universitaria."),
        "dcterms:issued": literals("2026-07-16"),
        "dcterms:language": literals("es"),
        "dcterms:type": literals("book"),
        "dcterms:format": literals("application/pdf"),
        "dcterms:license": literals("CC BY"),
        "dcterms:identifier": literals("https://pnpu.mes.gob.cu/publicaciones/gestion-editorial"),
        "bibo:isbn": literals("9789590000003"),
        "dcterms:publisher": linkedResource(200),
        "dcterms:creator": linkedResource(300),
        "dcterms:subject": linkedResource(400),
        "schema:keywords": literals("universidad", "editorial"),
      }),
      {
        publishersByOmekaId: new Map([[200, publisher]]),
        contributorsByOmekaId: new Map([[300, contributor]]),
        subjectsByOmekaId: new Map([[400, subject]]),
        mediaByItemOmekaId: new Map([
          [
            100,
            [
              resource(500, {
                "pnpu:resourceType": literals("pdf"),
                "o:original_url": uris("http://127.0.0.1/omeka-s/files/original/book.pdf"),
                "dcterms:format": literals("application/pdf"),
                "dcterms:language": literals("es"),
              }),
            ],
          ],
        ]),
      },
      quality,
    );

    expect(publication?.snapshot()).toMatchObject({
      title: "Gestion editorial universitaria",
      abstract: "Resumen de gestion editorial universitaria.",
      publicationDate: "2026-07-16",
      language: LanguageCode.create("es"),
      type: "book",
      license: "CC BY",
      keywords: ["universidad", "editorial"],
    });
    expect(publication?.publisher()).toBe(publisher);
    expect(publication?.contributors()).toEqual([contributor]);
    expect(publication?.subjects()).toEqual([subject]);
    expect(publication?.resources()[0]?.snapshot()).toMatchObject({
      type: "pdf",
      format: "application/pdf",
    });
    expect(quality.snapshot()).toMatchObject({ rejectedCount: 0, warningCount: 0 });
  });

  it("maps a publication cover image from linked Omeka media", () => {
    const quality = new OmekaQualityReport();
    const university = University.create({
      id: PnpuUuid.create("01990f5a-0000-7000-8000-000000000111"),
      officialName: "Ministerio de Educación Superior",
      country: "CU",
    });
    const publisher = Publisher.create({
      id: PnpuUuid.create("01990f5a-0000-7000-8000-000000000112"),
      officialName: "Editorial Universitaria",
      university,
      country: "CU",
    });
    const contributor = Contributor.create({
      id: PnpuUuid.create("01990f5a-0000-7000-8000-000000000113"),
      name: "Raul Torricella",
      roles: ["author"],
    });
    const subject = Subject.create({
      identifier: "30",
      preferredLabel: "Ciencias sociales",
    });
    const publication = mapOmekaPublication(
      resource(110, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000114"),
        "dcterms:title": literals("Libro con portada"),
        "dcterms:abstract": literals("Resumen de libro con portada."),
        "dcterms:issued": literals("2026-07-16"),
        "dcterms:language": literals("es"),
        "dcterms:type": literals("book"),
        "dcterms:format": literals("application/pdf"),
        "dcterms:license": literals("CC BY"),
        "dcterms:identifier": literals("https://pnpu.mes.gob.cu/publicaciones/libro-portada"),
        "bibo:isbn": literals("9789590000003"),
        "dcterms:publisher": linkedResource(210),
        "dcterms:creator": linkedResource(310),
        "dcterms:subject": linkedResource(410),
        "schema:keywords": literals("portada"),
      }),
      {
        publishersByOmekaId: new Map([[210, publisher]]),
        contributorsByOmekaId: new Map([[310, contributor]]),
        subjectsByOmekaId: new Map([[410, subject]]),
        mediaByItemOmekaId: new Map([
          [
            110,
            [
              resource(510, {
                "o:media_type": "image/jpeg",
                "o:original_url": "http://127.0.0.1/files/original/portada.jpg",
              }),
              resource(511, {
                "pnpu:resourceType": literals("pdf"),
                "o:original_url": "http://127.0.0.1/files/original/libro.pdf",
                "dcterms:format": literals("application/pdf"),
              }),
            ],
          ],
        ]),
        resourcePublicBaseUrl: "https://catalogo.reduniv.edu.cu",
      },
      quality,
    );

    expect(publication?.snapshot().coverImageUrl).toBe(
      "https://catalogo.reduniv.edu.cu/files/original/portada.jpg",
    );
    expect(quality.snapshot()).toMatchObject({ rejectedCount: 0, warningCount: 0 });
  });

  it("rejects publications without required references or media", () => {
    const quality = new OmekaQualityReport();
    const publication = mapOmekaPublication(
      resource(101, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000105"),
        "dcterms:title": literals("Registro incompleto"),
        "dcterms:abstract": literals("Resumen incompleto."),
        "dcterms:issued": literals("2026-07-16"),
        "dcterms:language": literals("es"),
        "dcterms:type": literals("book"),
        "dcterms:format": literals("application/pdf"),
        "dcterms:license": literals("CC BY"),
        "dcterms:identifier": literals("https://pnpu.mes.gob.cu/publicaciones/incompleto"),
        "bibo:isbn": literals("9789590000010"),
        "schema:keywords": literals("incompleto"),
      }),
      {
        publishersByOmekaId: new Map(),
        contributorsByOmekaId: new Map(),
        subjectsByOmekaId: new Map(),
        mediaByItemOmekaId: new Map(),
      },
      quality,
    );

    expect(publication).toBeNull();
    expect(quality.snapshot().issues[0]).toMatchObject({
      code: "OMEKA_UNRESOLVED_REFERENCE",
      field: "dcterms:publisher",
    });
  });

  it("rejects publications without public catalog quality metadata", () => {
    const quality = new OmekaQualityReport();
    const publication = mapOmekaPublication(
      resource(102, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000106"),
        "dcterms:title": literals("Sin resumen"),
        "dcterms:issued": literals("2026-07-16"),
        "dcterms:language": literals("es"),
        "dcterms:type": literals("book"),
        "dcterms:format": literals("application/pdf"),
        "dcterms:license": literals("CC BY"),
        "dcterms:identifier": literals("https://pnpu.mes.gob.cu/publicaciones/sin-resumen"),
        "bibo:isbn": literals("9789590000027"),
        "schema:keywords": literals("calidad"),
      }),
      {
        publishersByOmekaId: new Map(),
        contributorsByOmekaId: new Map(),
        subjectsByOmekaId: new Map(),
        mediaByItemOmekaId: new Map(),
      },
      quality,
    );

    expect(publication).toBeNull();
    expect(quality.snapshot().issues).toContainEqual(
      expect.objectContaining({
        code: "OMEKA_MISSING_REQUIRED_FIELD",
        field: "dcterms:abstract",
      }),
    );
  });

  it("maps digital resources and rejects invalid file size", () => {
    const quality = new OmekaQualityReport();

    expect(
      mapOmekaDigitalResource(
        resource(600, {
          "pnpu:resourceType": literals("pdf"),
          "o:original_url": uris("http://127.0.0.1/omeka-s/files/original/book.pdf"),
          "dcterms:format": literals("application/pdf"),
          "pnpu:fileSize": literals("-1"),
        }),
        quality,
      ),
    ).toBeNull();
    expect(quality.snapshot().issues[0]).toMatchObject({
      code: "OMEKA_INVALID_VALUE",
      field: "pnpu:fileSize",
    });
  });

  it("maps uploaded Omeka media using the native top-level original URL", () => {
    const quality = new OmekaQualityReport();

    const digitalResource = mapOmekaDigitalResource(
      resource(601, {
        "pnpu:resourceType": literals("pdf"),
        "o:original_url": "http://127.0.0.1/files/original/manual.pdf",
        "o:source": "manual.pdf",
        "dcterms:format": literals("application/pdf"),
        "dcterms:language": literals("es"),
      }),
      quality,
    );

    expect(digitalResource?.snapshot()).toMatchObject({
      type: "pdf",
      url: "http://127.0.0.1/files/original/manual.pdf",
      format: "application/pdf",
      language: LanguageCode.create("es"),
    });
    expect(quality.snapshot()).toMatchObject({ rejectedCount: 0, warningCount: 0 });
  });

  it("rewrites local Omeka media URLs to the configured public catalog base URL", () => {
    const quality = new OmekaQualityReport();

    const digitalResource = mapOmekaDigitalResource(
      resource(602, {
        "pnpu:resourceType": literals("pdf"),
        "o:original_url": "http://127.0.0.1/files/original/manual.pdf",
        "o:source": "manual.pdf",
        "dcterms:format": literals("application/pdf"),
      }),
      quality,
      {
        publicBaseUrl: "https://catalogo.reduniv.edu.cu",
      },
    );

    expect(digitalResource?.url()).toBe(
      "https://catalogo.reduniv.edu.cu/files/original/manual.pdf",
    );
    expect(quality.snapshot()).toMatchObject({ rejectedCount: 0, warningCount: 0 });
  });
});

function resource(id: number, values: Record<string, unknown>): OmekaJsonObject {
  return {
    "o:id": id,
    ...values,
  };
}

function literals(...values: readonly string[]): readonly OmekaJsonObject[] {
  return values.map((value) => ({ "@value": value }));
}

function uris(...values: readonly string[]): readonly OmekaJsonObject[] {
  return values.map((value) => ({ "@id": value }));
}

function linkedResource(id: number): readonly OmekaJsonObject[] {
  return [
    {
      "@id": `http://127.0.0.1/omeka-s/api/items/${String(id)}`,
      value_resource_id: id,
    },
  ];
}
