import { describe, expect, it } from "vitest";
import { PnpuUuid } from "../../domain";
import { createOmekaCatalogRepositories } from "./omeka-catalog-repositories";
import { mapOmekaSnapshotToPnpuCatalog } from "./omeka-pnpu-catalog-mapper";
import { createCompleteOmekaCatalogSnapshot } from "./omeka-test-fixtures";

describe("createOmekaCatalogRepositories", () => {
  it("exposes mapped Omeka catalog through application repository ports", async () => {
    const catalog = mapOmekaSnapshotToPnpuCatalog(createCompleteOmekaCatalogSnapshot());
    const repositories = createOmekaCatalogRepositories(catalog);
    const publicationId = PnpuUuid.create("01990f5a-0000-7000-8000-000000000205");
    const publisherId = PnpuUuid.create("01990f5a-0000-7000-8000-000000000203");
    const contributorId = PnpuUuid.create("01990f5a-0000-7000-8000-000000000201");
    const collectionId = PnpuUuid.create("01990f5a-0000-7000-8000-000000000204");

    const publication = await repositories.publications.findById(publicationId);
    const publisher = await repositories.publishers.findById(publisherId);
    const contributor = await repositories.contributors.findById(contributorId);
    const collection = await repositories.collections.findById(collectionId);
    const subject = await repositories.subjects.findByIdentifier("37.01");

    expect(publication?.title()).toBe("Gestion editorial universitaria");
    expect(publisher?.officialName()).toBe("Editorial UH");
    expect(contributor?.name()).toBe("Ana Perez");
    expect(collection?.title()).toBe("Biblioteca PNPU");
    expect(subject?.preferredLabel()).toBe("Educacion superior");
  });

  it("keeps publication filtering behavior aligned with current catalog API", async () => {
    const catalog = mapOmekaSnapshotToPnpuCatalog(createCompleteOmekaCatalogSnapshot());
    const repositories = createOmekaCatalogRepositories(catalog);
    const result = await repositories.publications.list({
      page: 1,
      pageSize: 20,
      q: "gestion editorial",
      language: "es",
      subject: "educacion",
    });

    expect(result.pagination).toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1,
      totalPages: 1,
    });
    expect(result.data[0]?.title()).toBe("Gestion editorial universitaria");
  });
});
