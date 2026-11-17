import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import HomePage, { dynamic } from "./page";

describe("HomePage", () => {
  it("is dynamic because catalog metrics depend on the active repository", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("renders the institutional home with catalog data", async () => {
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("CATALOGA");
    expect(html).toContain("PLATAFORMA NACIONAL DE PUBLICACIONES UNIVERSITARIAS");
    expect(html).toContain("Conectamos editoriales. Hacemos circular el conocimiento.");
    expect(html).not.toMatch(/<h1[^>]*>CATALOGA<\/h1>/);
    expect(html).toContain(
      "Descubre las publicaciones de las universidades cubanas. Un catálogo nacional que integra editoriales, autores y colecciones para ampliar la visibilidad y facilitar el acceso a la producción editorial universitaria.",
    );
    expect(html).toContain("Buscar por título, autor, editorial, ISBN o materia");
    expect(html).toContain("Publicaciones");
    expect(html).toContain("Editoriales");
    expect(html).toContain("Autores");
    expect(html).toContain("Colecciones");
    expect(html).toContain("Novedades");
    expect(html).toContain("Publicaciones recientes");
    expect(html).toContain("Arquitectura empresarial para universidades");
    expect(html).not.toContain("Red EDUNIV");
    expect(html).not.toContain("Conocer más");
    expect(html).toContain("Red de Editoriales");
    expect(html).not.toContain("RedUniv");
    expect(html).toContain("Directorio editorial");
    expect(html).not.toContain("Ver todas");
    expect(html).not.toContain("Ver colecciones");
    expect(html).not.toContain("Explorar por materias");
    expect(html).toContain("Colecciones destacadas");
    expect(html).not.toContain("Omeka S");
    expect(html).not.toContain("Portal PNPU");
    expect(html).not.toContain("Consultar catálogo");
    expect(html).not.toContain("Directorio de editoriales");
    expect(html).not.toContain("Estado del catálogo");
  });
});
