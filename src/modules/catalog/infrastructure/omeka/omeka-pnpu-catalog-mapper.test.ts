import { describe, expect, it } from "vitest";
import { mapOmekaSnapshotToPnpuCatalog } from "./omeka-pnpu-catalog-mapper";
import { createCompleteOmekaCatalogSnapshot } from "./omeka-test-fixtures";

describe("mapOmekaSnapshotToPnpuCatalog", () => {
  it("maps a complete Omeka snapshot into PNPU catalog entities", () => {
    const catalog = mapOmekaSnapshotToPnpuCatalog(createCompleteOmekaCatalogSnapshot());

    expect(catalog).toMatchObject({
      publications: [expect.any(Object)],
      contributors: [expect.any(Object)],
      publishers: [expect.any(Object)],
      universities: [expect.any(Object)],
      collections: [expect.any(Object)],
      subjects: [expect.any(Object)],
      quality: {
        rejectedCount: 0,
      },
    });
    expect(catalog.publications[0]?.title()).toBe("Gestion editorial universitaria");
    expect(catalog.publications[0]?.snapshot().collection?.title()).toBe("Biblioteca PNPU");
  });
});
