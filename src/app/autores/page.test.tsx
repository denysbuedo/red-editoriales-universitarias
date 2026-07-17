import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ContributorsPage, { dynamic } from "./page";

describe("ContributorsPage", () => {
  it("is dynamic because the authority list depends on the active repository", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the contributor authority list", async () => {
    const html = renderToStaticMarkup(await ContributorsPage());

    expect(html).toContain("Autores y contribuyentes");
    expect(html).toContain("Juana Perez Rodriguez");
    expect(html).toContain("https://orcid.org/0000-0002-1825-0097");
    expect(html).toContain("/autores/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01");
  });
});
