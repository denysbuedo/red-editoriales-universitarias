import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/admin/publication-imports/templates/publications.csv", () => {
  it("downloads the protected base publication template", async () => {
    const previousToken = process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    try {
      const response = await GET(
        new Request(
          "https://pnpu.mes.gob.cu/api/admin/publication-imports/templates/publications.csv",
          {
            headers: {
              "X-PNPU-Admin-Token": "expected-token",
            },
          },
        ),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toBe(
        'attachment; filename="pnpu-plantilla-publicaciones-base.csv"',
      );
      await expect(response.text()).resolves.toContain(
        "isbn,title,primaryContributor,publisher,genreOrPublicationType,format,publicationDate",
      );
    } finally {
      restoreEnvironmentValue("PNPU_PUBLICATION_IMPORT_TOKEN", previousToken);
    }
  });
});

function restoreEnvironmentValue(name: string, value: string | undefined): void {
  if (value === undefined) {
    Reflect.deleteProperty(process.env, name);
  } else {
    process.env[name] = value;
  }
}
