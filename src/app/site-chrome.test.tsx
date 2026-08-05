import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteShell } from "./site-chrome";

describe("SiteShell", () => {
  it("renders institutional navigation and footer", () => {
    const html = renderToStaticMarkup(
      <SiteShell>
        <main>Contenido</main>
      </SiteShell>,
    );

    expect(html).not.toContain("Ministerio de Educación Superior</span>");
    expect(html).toContain("/publicaciones");
    expect(html).toContain("/editoriales");
    expect(html).toContain("/admin");
    expect(html).not.toContain("/colecciones");
    expect(html).not.toContain("/autores");
    expect(html).not.toContain("/materias");
    expect(html).not.toContain("Enlaces operativos");
    expect(html).toContain("Red Nacional de Investigación y Educación de Avanzada");
    expect(html).toContain("Reduniv");
  });
});
