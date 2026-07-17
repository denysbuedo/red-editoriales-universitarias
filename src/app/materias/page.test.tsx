import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SubjectsPage from "./page";

describe("SubjectsPage", () => {
  it("renders the public subject taxonomy list", async () => {
    const html = renderToStaticMarkup(await SubjectsPage());

    expect(html).toContain("Materias del catálogo");
    expect(html).toContain("Ciencia de los ordenadores");
    expect(html).toContain("unesco:1203");
    expect(html).toContain("/materias/unesco%3A1203");
  });
});
