import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CollectionsPage, { dynamic } from "./page";

describe("CollectionsPage", () => {
  it("is dynamic because the collection list depends on the active repository", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the public collections list", async () => {
    const html = renderToStaticMarkup(await CollectionsPage());

    expect(html).toContain("Colecciones editoriales");
    expect(html).toContain("Arquitectura y gobierno universitario");
    expect(html).toContain("/colecciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08");
  });
});
