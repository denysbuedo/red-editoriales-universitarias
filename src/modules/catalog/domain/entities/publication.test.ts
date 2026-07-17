import { describe, expect, it } from "vitest";

import { DomainValidationError } from "../errors/domain-validation-error";
import { LanguageCode, Orcid, PnpuUuid } from "../value-objects";
import { Contributor, Identifier, Publication, Publisher, Resource, Subject, University } from ".";

const publicationId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05");
const publisherId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03");
const universityId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c02");
const contributorId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01");

function createPublisher(): Publisher {
  const university = University.create({
    id: universityId,
    officialName: "Universidad de La Habana",
    country: "CU",
  });

  return Publisher.create({
    id: publisherId,
    officialName: "Editorial Universidad de La Habana",
    university,
    country: "CU",
  });
}

function createContributor(): Contributor {
  return Contributor.create({
    id: contributorId,
    name: "Juana Perez Rodriguez",
    roles: ["author"],
    orcid: Orcid.create("0000-0002-1825-0097"),
  });
}

function createSubject(): Subject {
  return Subject.create({
    identifier: "unesco:1203",
    preferredLabel: "Ciencia de los ordenadores",
  });
}

function createResource(): Resource {
  return Resource.create({
    type: "pdf",
    url: "https://pnpu.mes.gob.cu/recursos/publicacion.pdf",
    format: "application/pdf",
    language: LanguageCode.create("es"),
  });
}

function createPublication(overrides: Partial<Parameters<typeof Publication.create>[0]> = {}) {
  return Publication.create({
    id: publicationId,
    title: "Arquitectura empresarial para universidades",
    publicationDate: "2026-07-14",
    language: LanguageCode.create("es"),
    publisher: createPublisher(),
    contributors: [createContributor()],
    identifiers: [Identifier.create("isbn", "9789590000003")],
    subjects: [createSubject()],
    resources: [createResource()],
    type: "book",
    format: "application/pdf",
    keywords: ["arquitectura empresarial", "universidades", "universidades"],
    ...overrides,
  });
}

describe("Publication", () => {
  it("creates a valid publication aggregate", () => {
    const publication = createPublication();

    expect(publication.id().equals(publicationId)).toBe(true);
    expect(publication.title()).toBe("Arquitectura empresarial para universidades");
    expect(publication.publisher().id().equals(publisherId)).toBe(true);
    expect(publication.snapshot().keywords).toEqual(["arquitectura empresarial", "universidades"]);
  });

  it("rejects publications without a publisher", () => {
    expect(() =>
      createPublication({
        publisher: undefined as unknown as Publisher,
      }),
    ).toThrow(DomainValidationError);
  });

  it("rejects publications without contributors", () => {
    expect(() => createPublication({ contributors: [] })).toThrow(DomainValidationError);
  });

  it("rejects publications without identifiers", () => {
    expect(() => createPublication({ identifiers: [] })).toThrow(DomainValidationError);
  });

  it("rejects publications without resources", () => {
    expect(() => createPublication({ resources: [] })).toThrow(DomainValidationError);
  });

  it("rejects publications without subjects", () => {
    expect(() => createPublication({ subjects: [] })).toThrow(DomainValidationError);
  });

  it("rejects invalid publication dates", () => {
    expect(() => createPublication({ publicationDate: "2026-02-30" })).toThrow(
      DomainValidationError,
    );
  });

  it("returns defensive copies for collection properties", () => {
    const publication = createPublication();
    const updatedContributors = [...publication.contributors(), createContributor()];

    expect(updatedContributors).toHaveLength(2);
    expect(publication.contributors()).toHaveLength(1);
  });
});
