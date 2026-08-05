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

    expect(html).toContain("Ministerio de Educación Superior");
    expect(html).toContain("/publicaciones");
    expect(html).toContain("/admin");
    expect(html).toContain("Red Nacional de Investigación y Educación de Avanzada");
    expect(html).toContain("Reduniv");
  });
});
