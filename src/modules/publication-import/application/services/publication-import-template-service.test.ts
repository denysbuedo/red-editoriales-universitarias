import { describe, expect, it } from "vitest";

import { PublicationImportTemplateService } from "@/modules/publication-import";

describe("PublicationImportTemplateService", () => {
  it("builds the official base publication CSV template", () => {
    const template = new PublicationImportTemplateService().buildBasePublicationTemplate();

    expect(template.fileName).toBe("pnpu-plantilla-publicaciones-base.csv");
    expect(template.contentType).toBe("text/csv; charset=utf-8");
    expect(template.content).toContain(
      "isbn,title,primaryContributor,publisher,genreOrPublicationType,format,publicationDate",
    );
    expect(template.content).toContain("9789590000003");
  });

  it("builds the official PNPU enrichment CSV template", () => {
    const template = new PublicationImportTemplateService().buildEnrichmentTemplate();

    expect(template.fileName).toBe("pnpu-plantilla-enriquecimiento.csv");
    expect(template.content).toContain(
      "row,pnpuUuid,title,isbn,doi,publicationDate,publisher,primaryContributor,contributorAuthorityIds,publisherAuthorityId,genreOrPublicationType,controlledTypeOrGenre,formats,digitalResourceUrl,language,subjects,license,notes",
    );
    expect(template.content).toContain("01990f5a-0000-7000-8000-000000000901");
  });
});
