import { describe, expect, it } from "vitest";

import { PublicationService, PublisherService } from "../../application";
import { Identifier, PnpuUuid, Publication } from "../../domain";
import { createSampleCatalogData } from "./sample-catalog-data";
import { InMemoryCollectionRepository } from "./in-memory-collection-repository";
import { InMemoryContributorRepository } from "./in-memory-contributor-repository";
import { InMemoryPublicationRepository } from "./in-memory-publication-repository";
import { InMemoryPublisherRepository } from "./in-memory-publisher-repository";
import { InMemorySubjectRepository } from "./in-memory-subject-repository";

describe("in-memory catalog repositories", () => {
  it("supports publication and publisher application services", async () => {
    const sampleData = createSampleCatalogData();
    const publicationService = new PublicationService(
      new InMemoryPublicationRepository(sampleData.publications),
    );
    const contributorRepository = new InMemoryContributorRepository(sampleData.contributors);
    const collectionRepository = new InMemoryCollectionRepository(sampleData.collections);
    const subjectRepository = new InMemorySubjectRepository(sampleData.subjects);
    const publisherService = new PublisherService(
      new InMemoryPublisherRepository(sampleData.publishers),
    );

    const publications = await publicationService.listPublications({ page: 1, pageSize: 10 });
    const publishers = await publisherService.listPublishers({ page: 1, pageSize: 10 });

    expect(publications.pagination.total).toBe(1);
    expect(publishers.pagination.total).toBe(1);
    await expect(contributorRepository.list({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: {
        total: 1,
      },
    });
    await expect(collectionRepository.list({ page: 1, pageSize: 10 })).resolves.toMatchObject({
      pagination: {
        total: 1,
      },
    });
    await expect(subjectRepository.findByIdentifier("unesco:1203")).resolves.toBe(
      sampleData.subjects[0],
    );
    await expect(
      publicationService.getPublication(sampleData.publications[0].id().value()),
    ).resolves.toBe(sampleData.publications[0]);
  });

  it("filters publications by search text, language and subject", async () => {
    const sampleData = createSampleCatalogData();
    const publicationService = new PublicationService(
      new InMemoryPublicationRepository(sampleData.publications),
    );

    await expect(
      publicationService.listPublications({
        page: 1,
        pageSize: 10,
        q: "gobierno de datos",
        language: "es",
        subject: "ordenadores",
      }),
    ).resolves.toMatchObject({
      pagination: {
        total: 1,
      },
    });

    await expect(
      publicationService.listPublications({
        page: 1,
        pageSize: 10,
        subject: "medicina",
      }),
    ).resolves.toMatchObject({
      pagination: {
        total: 0,
      },
    });
  });

  it("sorts publications before pagination", async () => {
    const sampleData = createSampleCatalogData();
    const firstPublication = sampleData.publications[0];
    const secondPublication = Publication.create({
      ...firstPublication.snapshot(),
      id: PnpuUuid.create("018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c09"),
      title: "Zoología editorial universitaria",
      publicationDate: "2026-07-15",
      identifiers: [Identifier.create("doi", "10.1234/pnpu.sort.01")],
    });
    const repository = new InMemoryPublicationRepository([firstPublication, secondPublication]);

    await expect(
      repository.list({ page: 1, pageSize: 1, sort: "publicationDateDesc" }),
    ).resolves.toMatchObject({
      data: [secondPublication],
      pagination: {
        total: 2,
      },
    });
    await expect(
      repository.list({ page: 1, pageSize: 1, sort: "titleAsc" }),
    ).resolves.toMatchObject({
      data: [firstPublication],
      pagination: {
        total: 2,
      },
    });
  });
});
