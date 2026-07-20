import { describe, expect, it } from "vitest";

import { InMemoryPublicationRepository } from "@/modules/catalog/infrastructure/in-memory";
import { createSampleCatalogData } from "@/modules/catalog/infrastructure/in-memory/sample-catalog-data";

import { CatalogPublicationImportDuplicateLookup } from "./catalog-publication-import-duplicate-lookup";

describe("CatalogPublicationImportDuplicateLookup", () => {
  it("finds existing catalog publications by ISBN", async () => {
    const sampleData = createSampleCatalogData();
    const lookup = new CatalogPublicationImportDuplicateLookup(
      new InMemoryPublicationRepository(sampleData.publications),
    );

    const matches = await lookup.findMatches([
      {
        type: "isbn",
        value: "9789590000003",
      },
    ]);

    expect(matches).toEqual([
      {
        identifierType: "isbn",
        identifierValue: "9789590000003",
        publicationId: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
        title: "Arquitectura empresarial para universidades",
      },
    ]);
  });
});
