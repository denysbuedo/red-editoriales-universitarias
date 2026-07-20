import { describe, expect, it } from "vitest";

import { createCatalogRepositories } from "@/modules/catalog/infrastructure";
import { PublicationImportAuthoritiesService } from "@/modules/publication-import";

describe("PublicationImportAuthoritiesService", () => {
  it("lists publishers, contributors and subjects for enrichment templates", async () => {
    const repositories = createCatalogRepositories();
    const service = new PublicationImportAuthoritiesService(
      {
        contributorRepository: repositories.contributorRepository,
        publisherRepository: repositories.publisherRepository,
        subjectRepository: repositories.subjectRepository,
      },
      {
        importRoot: "Readme",
        now: () => new Date("2026-07-20T14:00:00.000Z"),
      },
    );

    const authorities = await service.listAuthorities();

    expect(authorities.generatedAt).toBe("2026-07-20T14:00:00.000Z");
    expect(authorities.publishers[0]).toHaveProperty("id");
    expect(authorities.contributors[0]).toHaveProperty("roles");
    expect(authorities.subjects[0]).toHaveProperty("label");
  });
});
