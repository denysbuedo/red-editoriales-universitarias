import { describe, expect, it } from "vitest";
import { OmekaJsonObject } from "./omeka-api-client";
import {
  mapOmekaCollection,
  mapOmekaContributor,
  mapOmekaPublisher,
  mapOmekaSubject,
  mapOmekaUniversity,
} from "./omeka-pnpu-reference-mapper";
import { OmekaQualityReport } from "./omeka-quality-report";

describe("omeka-pnpu-reference-mapper", () => {
  it("maps PNPU Subject resources", () => {
    const quality = new OmekaQualityReport();
    const subject = mapOmekaSubject(
      resource(10, {
        "skos:notation": literals("37.01"),
        "skos:prefLabel": literals("Educacion superior"),
        "schema:url": uris("https://pnpu.mes.gob.cu/subjects/37.01"),
      }),
      quality,
    );

    expect(subject?.snapshot()).toMatchObject({
      identifier: "37.01",
      preferredLabel: "Educacion superior",
      uri: "https://pnpu.mes.gob.cu/subjects/37.01",
    });
    expect(quality.snapshot()).toMatchObject({ rejectedCount: 0, warningCount: 0 });
  });

  it("maps PNPU Contributor resources and warns on invalid optional ORCID", () => {
    const quality = new OmekaQualityReport();
    const contributor = mapOmekaContributor(
      resource(20, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000001"),
        "foaf:name": literals("Dra. Ana Perez"),
        "foaf:givenName": literals("Ana"),
        "foaf:familyName": literals("Perez"),
        "schema:roleName": literals("author", "unsupported-role"),
        "schema:sameAs": uris("https://orcid.org/0000-0000-0000-0000"),
        "schema:nationality": literals("CU"),
      }),
      quality,
    );

    expect(contributor?.snapshot()).toMatchObject({
      name: "Dra. Ana Perez",
      roles: ["author"],
      country: "CU",
    });
    expect(quality.snapshot()).toMatchObject({ rejectedCount: 0, warningCount: 2 });
  });

  it("maps University, Publisher and Collection with linked Omeka references", () => {
    const quality = new OmekaQualityReport();
    const universityResource = resource(30, {
      "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000002"),
      "schema:name": literals("Universidad de La Habana"),
      "schema:addressCountry": literals("CU"),
      "schema:url": uris("https://www.uh.cu"),
    });
    const subjectResource = resource(31, {
      "skos:notation": literals("001"),
      "skos:prefLabel": literals("Ciencias sociales"),
    });
    const university = mapOmekaUniversity(universityResource, quality);
    const subject = mapOmekaSubject(subjectResource, quality);

    expect(university).not.toBeNull();
    expect(subject).not.toBeNull();

    if (university === null || subject === null) {
      throw new Error("Expected valid university and subject fixtures.");
    }

    const publisher = mapOmekaPublisher(
      resource(40, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000003"),
        "schema:name": literals("Editorial UH"),
        "schema:parentOrganization": linkedResource(30),
        "schema:addressCountry": literals("CU"),
        "schema:url": uris("https://editorial.uh.cu"),
      }),
      {
        universitiesByOmekaId: new Map([[30, university]]),
      },
      quality,
    );

    expect(publisher).not.toBeNull();

    if (publisher === null) {
      throw new Error("Expected valid publisher fixture.");
    }

    const collection = mapOmekaCollection(
      resource(50, {
        "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000004"),
        "dcterms:title": literals("Biblioteca de educacion superior"),
        "dcterms:publisher": linkedResource(40),
        "dcterms:subject": linkedResource(31),
      }),
      {
        publishersByOmekaId: new Map([[40, publisher]]),
        subjectsByOmekaId: new Map([[31, subject]]),
      },
      quality,
    );

    expect(university.officialName()).toBe("Universidad de La Habana");
    expect(publisher.officialName()).toBe("Editorial UH");
    expect(collection?.snapshot()).toMatchObject({
      title: "Biblioteca de educacion superior",
      subjects: [subject],
    });
    expect(quality.snapshot()).toMatchObject({ rejectedCount: 0 });
  });

  it("rejects incomplete resources without throwing", () => {
    const quality = new OmekaQualityReport();

    expect(
      mapOmekaSubject(resource(60, { "skos:prefLabel": literals("Incompleto") }), quality),
    ).toBeNull();
    expect(
      mapOmekaPublisher(
        resource(61, {
          "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000005"),
          "schema:name": literals("Editorial sin universidad"),
          "schema:addressCountry": literals("CU"),
        }),
        {},
        quality,
      ),
    ).toBeNull();

    expect(quality.snapshot()).toMatchObject({
      rejectedCount: 2,
      warningCount: 0,
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
