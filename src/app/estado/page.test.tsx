import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CatalogStatusPage from "./page";

describe("CatalogStatusPage", () => {
  it("renders the catalog status page without Omeka configuration", async () => {
    const previousBaseUrl = process.env.PNPU_OMEKA_BASE_URL;
    delete process.env.PNPU_OMEKA_BASE_URL;

    try {
      const html = renderToStaticMarkup(await CatalogStatusPage());

      expect(html).toContain("Estado del catálogo");
      expect(html).toContain("Omeka no configurado");
      expect(html).toContain("Repositorio");
    } finally {
      if (previousBaseUrl !== undefined) {
        process.env.PNPU_OMEKA_BASE_URL = previousBaseUrl;
      }
    }
  });
});
