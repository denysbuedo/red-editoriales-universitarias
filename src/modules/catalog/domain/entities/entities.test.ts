import { describe, expect, it } from "vitest";

import { DomainValidationError } from "../errors/domain-validation-error";
import { Doi, LanguageCode, Orcid, PnpuUuid } from "../value-objects";
import { Collection, Contributor, Identifier, Publisher, Resource, Subject, University } from ".";

const universityId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c02");
const publisherId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03");
const collectionId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c04");
const contributorId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01");

function createUniversity(): University {
  return University.create({
    id: universityId,
    officialName: " Universidad de La Habana ",
    acronym: " UH ",
    universityCode: " MES-UH ",
    province: " La Habana ",
    country: "cu",
    website: "https://www.uh.cu",
  });
}

function createPublisher(): Publisher {
  return Publisher.create({
    id: publisherId,
    officialName: " Editorial Universidad de La Habana ",
    university: createUniversity(),
    country: "CU",
    website: "https://www.uh.cu/editorial",
  });
}

describe("University", () => {
  it("normalizes valid institutional data", () => {
    const university = createUniversity();

    expect(university.officialName()).toBe("Universidad de La Habana");
    expect(university.country()).toBe("CU");
    expect(university.snapshot().website).toBe("https://www.uh.cu/");
  });

  it("rejects empty official names", () => {
    expect(() =>
      University.create({
        id: universityId,
        officialName: " ",
        country: "CU",
      }),
    ).toThrow(DomainValidationError);
  });
});

describe("Publisher", () => {
  it("requires a university relationship", () => {
    const publisher = createPublisher();

    expect(publisher.university().id().equals(universityId)).toBe(true);
  });

  it("rejects invalid country codes", () => {
    expect(() =>
      Publisher.create({
        id: publisherId,
        officialName: "Editorial Universidad de La Habana",
        university: createUniversity(),
        country: "CUB",
      }),
    ).toThrow(DomainValidationError);
  });
});

describe("Contributor", () => {
  it("normalizes contributor data and deduplicates roles", () => {
    const contributor = Contributor.create({
      id: contributorId,
      name: " Juana Perez Rodriguez ",
      roles: ["author", "author"],
      orcid: Orcid.create("https://orcid.org/0000-0002-1825-0097"),
      country: "cu",
    });

    expect(contributor.name()).toBe("Juana Perez Rodriguez");
    expect(contributor.roles()).toEqual(["author"]);
    expect(contributor.snapshot().country).toBe("CU");
  });

  it("rejects contributors without roles", () => {
    expect(() =>
      Contributor.create({
        id: contributorId,
        name: "Juana Perez Rodriguez",
        roles: [],
      }),
    ).toThrow(DomainValidationError);
  });
});

describe("Subject", () => {
  it("creates SKOS-like subject references", () => {
    const subject = Subject.create({
      identifier: " unesco:1203 ",
      preferredLabel: " Ciencia de los ordenadores ",
      uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
    });

    expect(subject.identifier()).toBe("unesco:1203");
    expect(subject.preferredLabel()).toBe("Ciencia de los ordenadores");
  });

  it("rejects invalid subject URIs", () => {
    expect(() =>
      Subject.create({
        identifier: "unesco:1203",
        preferredLabel: "Ciencia de los ordenadores",
        uri: "not a url",
      }),
    ).toThrow(DomainValidationError);
  });
});

describe("Collection", () => {
  it("requires a publisher relationship", () => {
    const collection = Collection.create({
      id: collectionId,
      title: " Biblioteca Universitaria ",
      publisher: createPublisher(),
      subjects: [
        Subject.create({
          identifier: "unesco:1203",
          preferredLabel: "Ciencia de los ordenadores",
        }),
      ],
    });

    expect(collection.title()).toBe("Biblioteca Universitaria");
    expect(collection.publisher().id().equals(publisherId)).toBe(true);
  });
});

describe("Identifier", () => {
  it("normalizes ISBN, DOI and PNPU UUID identifiers", () => {
    expect(Identifier.create("isbn", "978-959-000-000-3").value()).toBe("9789590000003");
    expect(Identifier.create("doi", "10.1234/PNPU.Book.01").value()).toBe(
      Doi.create("10.1234/pnpu.book.01").value(),
    );
    expect(Identifier.create("pnpuUuid", universityId.value()).value()).toBe(universityId.value());
  });

  it("rejects malformed handles", () => {
    expect(() => Identifier.create("handle", "invalid")).toThrow(DomainValidationError);
  });
});

describe("Resource", () => {
  it("normalizes digital resource data", () => {
    const resource = Resource.create({
      type: "pdf",
      url: "https://pnpu.mes.gob.cu/resource.pdf",
      format: " application/pdf ",
      fileSize: 1024,
      checksum: " d41d8cd98f00b204e9800998ecf8427e ",
      language: LanguageCode.create("ES"),
      license: " CC BY ",
    });

    expect(resource.url()).toBe("https://pnpu.mes.gob.cu/resource.pdf");
    expect(resource.format()).toBe("application/pdf");
    expect(resource.snapshot().checksum).toBe("d41d8cd98f00b204e9800998ecf8427e");
  });

  it("rejects negative file sizes", () => {
    expect(() =>
      Resource.create({
        type: "pdf",
        url: "https://pnpu.mes.gob.cu/resource.pdf",
        format: "application/pdf",
        fileSize: -1,
      }),
    ).toThrow(DomainValidationError);
  });
});
