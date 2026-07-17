import { describe, expect, it } from "vitest";

import {
  Contributor,
  Collection,
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
import { ApplicationError } from "../errors/application-error";
import { paginateItems, PageRequest, PaginatedResult } from "../pagination";
import {
  CollectionRepository,
  ContributorRepository,
  PublicationListQuery,
  PublicationRepository,
  PublisherRepository,
  RecentPublicationsRequest,
  SubjectRepository,
} from "../ports";
import {
  CollectionService,
  ContributorService,
  PublicationService,
  PublisherService,
  SitemapService,
  SubjectService,
} from ".";

const universityId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c02");
const publisherId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03");
const secondPublisherId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c06");
const contributorId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01");
const publicationId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05");
const secondPublicationId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c07");
const collectionId = PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08");

class FakePublicationRepository implements PublicationRepository {
  public constructor(private readonly publications: readonly Publication[]) {}

  public findById(id: PnpuUuid): Promise<Publication | null> {
    return Promise.resolve(
      this.publications.find((publication) => publication.id().equals(id)) ?? null,
    );
  }

  public list(request: PublicationListQuery): Promise<PaginatedResult<Publication>> {
    const publications = this.publications.filter((publication) => {
      const snapshot = publication.snapshot();

      if (request.language !== undefined && snapshot.language.value() !== request.language) {
        return false;
      }

      if (
        request.publisherId !== undefined &&
        !snapshot.publisher.id().equals(request.publisherId)
      ) {
        return false;
      }

      if (request.contributorId !== undefined) {
        const contributorId = request.contributorId;

        if (!snapshot.contributors.some((contributor) => contributor.id().equals(contributorId))) {
          return false;
        }
      }

      if (request.collectionId !== undefined) {
        const collectionId = request.collectionId;

        if (snapshot.collection?.id().equals(collectionId) !== true) {
          return false;
        }
      }

      if (request.subject !== undefined) {
        const subject = request.subject.toLowerCase();

        if (
          !snapshot.subjects.some((item) => {
            const itemSnapshot = item.snapshot();

            return (
              itemSnapshot.identifier.toLowerCase().includes(subject) ||
              itemSnapshot.preferredLabel.toLowerCase().includes(subject)
            );
          })
        ) {
          return false;
        }
      }

      if (request.q !== undefined) {
        return snapshot.title.toLowerCase().includes(request.q.toLowerCase());
      }

      return true;
    });

    return Promise.resolve(paginateItems(publications, request));
  }

  public listRecent(request: RecentPublicationsRequest): Promise<readonly Publication[]> {
    return Promise.resolve(this.publications.slice(0, request.limit));
  }
}

class FakeContributorRepository implements ContributorRepository {
  public constructor(private readonly contributors: readonly Contributor[]) {}

  public findById(id: PnpuUuid): Promise<Contributor | null> {
    return Promise.resolve(
      this.contributors.find((contributor) => contributor.id().equals(id)) ?? null,
    );
  }

  public list(request: PageRequest): Promise<PaginatedResult<Contributor>> {
    return Promise.resolve(paginateItems(this.contributors, request));
  }
}

class FakeCollectionRepository implements CollectionRepository {
  public constructor(private readonly collections: readonly Collection[]) {}

  public findById(id: PnpuUuid): Promise<Collection | null> {
    return Promise.resolve(
      this.collections.find((collection) => collection.id().equals(id)) ?? null,
    );
  }

  public list(request: PageRequest): Promise<PaginatedResult<Collection>> {
    return Promise.resolve(paginateItems(this.collections, request));
  }
}

class FakePublisherRepository implements PublisherRepository {
  public constructor(private readonly publishers: readonly Publisher[]) {}

  public findById(id: PnpuUuid): Promise<Publisher | null> {
    return Promise.resolve(this.publishers.find((publisher) => publisher.id().equals(id)) ?? null);
  }

  public list(request: PageRequest): Promise<PaginatedResult<Publisher>> {
    return Promise.resolve(paginateItems(this.publishers, request));
  }
}

class FakeSubjectRepository implements SubjectRepository {
  public constructor(private readonly subjects: readonly Subject[]) {}

  public findByIdentifier(identifier: string): Promise<Subject | null> {
    return Promise.resolve(
      this.subjects.find((subject) => subject.identifier() === identifier) ?? null,
    );
  }

  public list(request: PageRequest): Promise<PaginatedResult<Subject>> {
    return Promise.resolve(paginateItems(this.subjects, request));
  }
}

function createUniversity(): University {
  return University.create({
    id: universityId,
    officialName: "Universidad de La Habana",
    country: "CU",
  });
}

function createPublisher(id: PnpuUuid = publisherId): Publisher {
  return Publisher.create({
    id,
    officialName: id.equals(publisherId)
      ? "Editorial Universidad de La Habana"
      : "Editorial Universitaria Oriente",
    university: createUniversity(),
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

function createCollection(): Collection {
  return Collection.create({
    id: collectionId,
    title: "Arquitectura y gobierno universitario",
    publisher: createPublisher(),
  });
}

function createPublication(id: PnpuUuid = publicationId): Publication {
  return Publication.create({
    id,
    title: id.equals(publicationId)
      ? "Arquitectura empresarial para universidades"
      : "Gobierno de datos universitarios",
    publicationDate: id.equals(publicationId) ? "2026-07-14" : "2026-07-15",
    language: LanguageCode.create("es"),
    publisher: createPublisher(),
    contributors: [createContributor()],
    identifiers: [
      id.equals(publicationId)
        ? Identifier.create("isbn", "9789590000003")
        : Identifier.create("doi", "10.1234/pnpu.book.02"),
    ],
    subjects: [
      Subject.create({
        identifier: "unesco:1203",
        preferredLabel: "Ciencia de los ordenadores",
      }),
    ],
    resources: [
      Resource.create({
        type: "pdf",
        url: `https://pnpu.mes.gob.cu/recursos/${id.value()}.pdf`,
        format: "application/pdf",
      }),
    ],
    type: "book",
    format: "application/pdf",
    collection: createCollection(),
  });
}

describe("PublicationService", () => {
  it("gets a publication by PNPU UUID", async () => {
    const service = new PublicationService(
      new FakePublicationRepository([createPublication(), createPublication(secondPublicationId)]),
    );

    const publication = await service.getPublication(publicationId.value());

    expect(publication.title()).toBe("Arquitectura empresarial para universidades");
  });

  it("lists publications with normalized pagination", async () => {
    const service = new PublicationService(
      new FakePublicationRepository([createPublication(), createPublication(secondPublicationId)]),
    );

    const result = await service.listPublications({ page: 1, pageSize: 1 });

    expect(result.data).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2 });
  });

  it("lists publications with normalized filters", async () => {
    const service = new PublicationService(
      new FakePublicationRepository([createPublication(), createPublication(secondPublicationId)]),
    );

    const result = await service.listPublications({
      page: 1,
      pageSize: 10,
      q: "gobierno",
      language: "ES",
      publisherId: publisherId.value(),
      contributorId: contributorId.value(),
      collectionId: collectionId.value(),
      subject: "ordenadores",
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id().equals(secondPublicationId)).toBe(true);
  });

  it("lists recent publications with a bounded limit", async () => {
    const service = new PublicationService(
      new FakePublicationRepository([createPublication(), createPublication(secondPublicationId)]),
    );

    await expect(service.listRecentPublications({ limit: 1 })).resolves.toHaveLength(1);
  });

  it("throws PNPU-404 when a publication does not exist", async () => {
    const service = new PublicationService(new FakePublicationRepository([]));

    await expect(service.getPublication(publicationId.value())).rejects.toMatchObject({
      code: "PNPU-404",
      message: "Publication not found.",
    });
  });

  it("throws PNPU-422 for invalid publication identifiers", async () => {
    const service = new PublicationService(new FakePublicationRepository([]));

    await expect(service.getPublication("not-a-uuid")).rejects.toMatchObject({
      code: "PNPU-422",
    });
  });

  it("throws PNPU-422 for invalid pagination", async () => {
    const service = new PublicationService(new FakePublicationRepository([]));

    await expect(service.listPublications({ page: 0 })).rejects.toBeInstanceOf(ApplicationError);
  });

  it("throws PNPU-422 for invalid publication filters", async () => {
    const service = new PublicationService(new FakePublicationRepository([]));

    await expect(service.listPublications({ language: "spa" })).rejects.toMatchObject({
      code: "PNPU-422",
    });
    await expect(service.listPublications({ publisherId: "not-a-uuid" })).rejects.toMatchObject({
      code: "PNPU-422",
    });
    await expect(service.listPublications({ contributorId: "not-a-uuid" })).rejects.toMatchObject({
      code: "PNPU-422",
    });
    await expect(service.listPublications({ collectionId: "not-a-uuid" })).rejects.toMatchObject({
      code: "PNPU-422",
    });
    await expect(service.listPublications({ sort: "unsupported" })).rejects.toMatchObject({
      code: "PNPU-422",
      message: "Publication sort is not supported.",
    });
  });
});

describe("PublisherService", () => {
  it("gets a publisher by PNPU UUID", async () => {
    const service = new PublisherService(
      new FakePublisherRepository([createPublisher(), createPublisher(secondPublisherId)]),
    );

    const publisher = await service.getPublisher(publisherId.value());

    expect(publisher.officialName()).toBe("Editorial Universidad de La Habana");
  });

  it("lists publishers with pagination", async () => {
    const service = new PublisherService(
      new FakePublisherRepository([createPublisher(), createPublisher(secondPublisherId)]),
    );

    const result = await service.listPublishers({ page: 1, pageSize: 2 });

    expect(result.data).toHaveLength(2);
    expect(result.pagination.totalPages).toBe(1);
  });

  it("throws PNPU-404 when a publisher does not exist", async () => {
    const service = new PublisherService(new FakePublisherRepository([]));

    await expect(service.getPublisher(publisherId.value())).rejects.toMatchObject({
      code: "PNPU-404",
      message: "Publisher not found.",
    });
  });
});

describe("ContributorService", () => {
  it("gets a contributor profile with associated publications", async () => {
    const service = new ContributorService(
      new FakeContributorRepository([createContributor()]),
      new FakePublicationRepository([createPublication(), createPublication(secondPublicationId)]),
    );

    const profile = await service.getContributor(contributorId.value());

    expect(profile.contributor.name()).toBe("Juana Perez Rodriguez");
    expect(profile.publications).toHaveLength(2);
  });

  it("lists contributor profiles with publication counts", async () => {
    const service = new ContributorService(
      new FakeContributorRepository([createContributor()]),
      new FakePublicationRepository([createPublication()]),
    );

    const result = await service.listContributors({ page: 1, pageSize: 10 });

    expect(result.pagination.total).toBe(1);
    expect(result.data[0].publications).toHaveLength(1);
  });

  it("throws PNPU-404 when a contributor does not exist", async () => {
    const service = new ContributorService(
      new FakeContributorRepository([]),
      new FakePublicationRepository([]),
    );

    await expect(service.getContributor(contributorId.value())).rejects.toMatchObject({
      code: "PNPU-404",
      message: "Contributor not found.",
    });
  });
});

describe("SubjectService", () => {
  it("gets a subject profile with associated publications", async () => {
    const service = new SubjectService(
      new FakeSubjectRepository([
        Subject.create({
          identifier: "unesco:1203",
          preferredLabel: "Ciencia de los ordenadores",
        }),
      ]),
      new FakePublicationRepository([createPublication()]),
    );

    const profile = await service.getSubject("unesco:1203");

    expect(profile.subject.preferredLabel()).toBe("Ciencia de los ordenadores");
    expect(profile.publications).toHaveLength(1);
  });

  it("throws PNPU-404 when a subject does not exist", async () => {
    const service = new SubjectService(
      new FakeSubjectRepository([]),
      new FakePublicationRepository([]),
    );

    await expect(service.getSubject("unesco:9999")).rejects.toMatchObject({
      code: "PNPU-404",
      message: "Subject not found.",
    });
  });
});

describe("CollectionService", () => {
  it("gets a collection profile with associated publications", async () => {
    const service = new CollectionService(
      new FakeCollectionRepository([createCollection()]),
      new FakePublicationRepository([createPublication()]),
    );

    const profile = await service.getCollection(collectionId.value());

    expect(profile.collection.title()).toBe("Arquitectura y gobierno universitario");
    expect(profile.publications).toHaveLength(1);
  });

  it("throws PNPU-404 when a collection does not exist", async () => {
    const service = new CollectionService(
      new FakeCollectionRepository([]),
      new FakePublicationRepository([]),
    );

    await expect(service.getCollection(collectionId.value())).rejects.toMatchObject({
      code: "PNPU-404",
      message: "Collection not found.",
    });
  });
});

describe("SitemapService", () => {
  it("builds publication and publisher sitemap entries", async () => {
    const service = new SitemapService(
      new FakePublicationRepository([createPublication()]),
      new FakeCollectionRepository([createCollection()]),
      new FakePublisherRepository([createPublisher()]),
      new FakeContributorRepository([createContributor()]),
      new FakeSubjectRepository([
        Subject.create({
          identifier: "unesco:1203",
          preferredLabel: "Ciencia de los ordenadores",
        }),
      ]),
      { publicBaseUrl: "https://pnpu.mes.gob.cu/" },
    );

    await expect(service.listPublicationEntries()).resolves.toEqual([
      {
        url: `https://pnpu.mes.gob.cu/publicaciones/${publicationId.value()}`,
        changeFrequency: "weekly",
        priority: 0.8,
      },
    ]);
    await expect(service.listCollectionEntries()).resolves.toEqual([
      {
        url: `https://pnpu.mes.gob.cu/colecciones/${collectionId.value()}`,
        changeFrequency: "monthly",
        priority: 0.7,
      },
    ]);
    await expect(service.listPublisherEntries()).resolves.toEqual([
      {
        url: `https://pnpu.mes.gob.cu/editoriales/${publisherId.value()}`,
        changeFrequency: "monthly",
        priority: 0.7,
      },
    ]);
    await expect(service.listContributorEntries()).resolves.toEqual([
      {
        url: `https://pnpu.mes.gob.cu/autores/${contributorId.value()}`,
        changeFrequency: "monthly",
        priority: 0.7,
      },
    ]);
    await expect(service.listSubjectEntries()).resolves.toEqual([
      {
        url: "https://pnpu.mes.gob.cu/materias/unesco%3A1203",
        changeFrequency: "monthly",
        priority: 0.6,
      },
    ]);
  });
});
