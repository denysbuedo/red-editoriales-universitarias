import { describe, expect, it } from "vitest";

import { ApplicationError } from "../application";
import {
  createCatalogRepositories,
  createCatalogRepositoriesAsync,
  readCatalogRepositoryMode,
} from "./catalog-repository-factory";

describe("readCatalogRepositoryMode", () => {
  it("defaults to in-memory", () => {
    expect(readCatalogRepositoryMode({})).toBe("in-memory");
  });

  it("accepts explicit in-memory mode", () => {
    expect(readCatalogRepositoryMode({ PNPU_CATALOG_REPOSITORY: "in-memory" })).toBe("in-memory");
  });

  it("accepts explicit omeka mode as a configuration value", () => {
    expect(readCatalogRepositoryMode({ PNPU_CATALOG_REPOSITORY: "omeka" })).toBe("omeka");
  });

  it("rejects unknown repository modes", () => {
    expect(() => readCatalogRepositoryMode({ PNPU_CATALOG_REPOSITORY: "postgres" })).toThrow(
      ApplicationError,
    );
  });
});

describe("createCatalogRepositories", () => {
  it("creates in-memory repositories by default", async () => {
    const repositories = createCatalogRepositories({});
    const collections = await repositories.collectionRepository.list({ page: 1, pageSize: 10 });
    const contributors = await repositories.contributorRepository.list({ page: 1, pageSize: 10 });
    const publications = await repositories.publicationRepository.list({ page: 1, pageSize: 10 });
    const publishers = await repositories.publisherRepository.list({ page: 1, pageSize: 10 });
    const subjects = await repositories.subjectRepository.list({ page: 1, pageSize: 10 });

    expect(repositories.mode).toBe("in-memory");
    expect(collections.pagination.total).toBe(1);
    expect(contributors.pagination.total).toBe(1);
    expect(publications.pagination.total).toBe(1);
    expect(publishers.pagination.total).toBe(1);
    expect(subjects.pagination.total).toBe(1);
  });

  it("does not activate Omeka repository before mapping is approved", () => {
    expect(() => createCatalogRepositories({ PNPU_CATALOG_REPOSITORY: "omeka" })).toThrow(
      "Omeka catalog repository requires an approved Omeka-to-PNPU mapping before activation.",
    );
  });
});

describe("createCatalogRepositoriesAsync", () => {
  it("creates in-memory repositories by default", async () => {
    const repositories = await createCatalogRepositoriesAsync({});

    expect(repositories.mode).toBe("in-memory");
  });

  it("requires an explicit approved Omeka mapping guard", async () => {
    await expect(
      createCatalogRepositoriesAsync({ PNPU_CATALOG_REPOSITORY: "omeka" }),
    ).rejects.toThrow(
      "Omeka catalog repository requires PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true before activation.",
    );
  });

  it("requires Omeka base URL when the approved Omeka repository is selected", async () => {
    await expect(
      createCatalogRepositoriesAsync({
        PNPU_CATALOG_REPOSITORY: "omeka",
        PNPU_OMEKA_REQUIRE_APPROVED_MAPPING: "true",
      }),
    ).rejects.toThrow("PNPU_OMEKA_BASE_URL is required when PNPU_CATALOG_REPOSITORY is omeka.");
  });

  it("validates Omeka snapshot page size", async () => {
    await expect(
      createCatalogRepositoriesAsync({
        PNPU_CATALOG_REPOSITORY: "omeka",
        PNPU_OMEKA_BASE_URL: "https://omeka.example.edu",
        PNPU_OMEKA_PAGE_SIZE: "0",
        PNPU_OMEKA_REQUIRE_APPROVED_MAPPING: "true",
      }),
    ).rejects.toThrow("PNPU_OMEKA_PAGE_SIZE must be a positive integer.");
  });

  it("validates Omeka catalog cache TTL", async () => {
    await expect(
      createCatalogRepositoriesAsync({
        PNPU_CATALOG_REPOSITORY: "omeka",
        PNPU_OMEKA_BASE_URL: "https://omeka.example.edu",
        PNPU_OMEKA_CACHE_TTL_SECONDS: "-1",
        PNPU_OMEKA_REQUIRE_APPROVED_MAPPING: "true",
      }),
    ).rejects.toThrow("PNPU_OMEKA_CACHE_TTL_SECONDS must be a non-negative integer.");
  });
});
