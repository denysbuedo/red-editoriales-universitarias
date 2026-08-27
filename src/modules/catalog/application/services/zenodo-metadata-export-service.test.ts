import { describe, expect, it } from "vitest";

import { createSampleCatalogData } from "../../infrastructure/in-memory";
import { toPublicationDetail } from "../mappers";
import { ZenodoMetadataExportService } from "./zenodo-metadata-export-service";

describe("ZenodoMetadataExportService", () => {
  it("builds a Zenodo metadata candidate package from publication details", () => {
    const publication = toPublicationDetail(createSampleCatalogData().publications[0]);
    const service = new ZenodoMetadataExportService();
    const result = service.buildPackage({
      publications: [publication],
      generatedAt: new Date("2026-08-27T10:00:00.000Z"),
    });

    expect(result.manifest).toEqual({
      profile: "PNPU_ZENODO_METADATA_CANDIDATE_V1",
      generatedAt: "2026-08-27T10:00:00.000Z",
      totalPublications: 1,
      exportedPublications: 1,
      warningCount: 1,
    });
    expect(result.records[0]).toMatchObject({
      pnpuId: publication.id,
      metadata: {
        title: publication.title,
        upload_type: "publication",
        publication_date: publication.publicationDate,
        creators: [
          { name: "Juana Perez Rodriguez", orcid: "https://orcid.org/0000-0002-1825-0097" },
        ],
        license: "cc-by-4.0",
      },
      pnpu: {
        publisherId: publication.publisher.id,
        publisherName: publication.publisher.officialName,
        publicationType: "book",
      },
      files: [{ format: "application/pdf", type: "pdf" }],
    });
  });

  it("reports publications that still do not have a DOI", () => {
    const publication = toPublicationDetail(createSampleCatalogData().publications[0]);
    const service = new ZenodoMetadataExportService();
    const result = service.buildPackage({ publications: [publication] });

    expect(result.warnings).toContainEqual({
      publicationId: publication.id,
      field: "doi",
      message: "La publicacion no tiene DOI PNPU/Zenodo registrado.",
    });
  });
});
