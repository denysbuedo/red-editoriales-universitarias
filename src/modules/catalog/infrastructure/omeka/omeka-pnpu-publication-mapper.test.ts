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
        "dcterms:issued": literals("2026-07-16"),
        "dcterms:language": literals("es"),
        "dcterms:type": literals("book"),
        "dcterms:format": literals("application/pdf"),
        "dcterms:identifier": literals("https://pnpu.mes.gob.cu/publicaciones/gestion-editorial"),
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
      publicationDate: "2026-07-16",
      language: LanguageCode.create("es"),
      type: "book",
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

  it("rejects publications without required references or media", () => {
    const quality = new OmekaQualityReport();
    const publication = mapOmekaPublication(
      resource(101, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000105"),
        "dcterms:title": literals("Registro incompleto"),
        "dcterms:issued": literals("2026-07-16"),
        "dcterms:language": literals("es"),
        "dcterms:type": literals("book"),
        "dcterms:format": literals("application/pdf"),
        "dcterms:identifier": literals("https://pnpu.mes.gob.cu/publicaciones/incompleto"),
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
