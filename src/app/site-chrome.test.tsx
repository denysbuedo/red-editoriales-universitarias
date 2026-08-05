import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SiteShell } from "./site-chrome";

describe("SiteShell", () => {
  it("renders institutional navigation and footer", () => {
    const html = renderToStaticMarkup(
      <SiteShell session={null}>
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

  it("renders the active administrator profile in the main header", () => {
    const html = renderToStaticMarkup(
      <SiteShell
        session={{
          displayName: "Admin PNPU",
          email: "admin@example.edu",
        }}
      >
        <main>Contenido</main>
      </SiteShell>,
    );

    expect(html).toContain("Perfil administrativo");
    expect(html).toContain("Admin PNPU");
    expect(html).toContain("admin@example.edu");
    expect(html).toContain("/api/admin/auth/logout");
  });
});
