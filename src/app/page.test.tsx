import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage, { dynamic } from "./page";

describe("HomePage", () => {
  it("is dynamic because catalog metrics depend on the active repository", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the institutional home with catalog data", async () => {
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Catálogo nacional de editoriales universitarias");
    expect(html).toContain(
      "Punto de acceso público a la producción editorial universitaria cubana",
    );
    expect(html).toContain("Publicaciones");
    expect(html).toContain("Editoriales");
    expect(html).toContain("Autores");
    expect(html).toContain("Colecciones");
    expect(html).toContain("Publicaciones recientes");
    expect(html).toContain("Arquitectura empresarial para universidades");
    expect(html).toContain("Editoriales integradas");
    expect(html).toContain("Materias principales");
    expect(html).toContain("/estado");
  });
});
