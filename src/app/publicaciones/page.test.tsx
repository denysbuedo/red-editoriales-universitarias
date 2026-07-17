import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PublicationsPage from "./page";

describe("PublicationsPage", () => {
  it("renders the publication catalog page", async () => {
    const html = renderToStaticMarkup(await PublicationsPage());

    expect(html).toContain("Publicaciones universitarias");
    expect(html).toContain("Arquitectura empresarial para universidades");
    expect(html).toContain("Gobierno, integración y sostenibilidad tecnológica");
    expect(html).toContain("ISBN: 9789590000003");
    expect(html).toContain("Ciencia de los ordenadores");
    expect(html).toContain("/publicaciones?subject=unesco%3A1203");
    expect(html).toContain("gobierno de datos");
    expect(html).toContain('name="q"');
    expect(html).toContain('name="language"');
    expect(html).toContain('name="subject"');
    expect(html).toContain('name="contributorId"');
    expect(html).toContain('name="collectionId"');
    expect(html).toContain('name="sort"');
    expect(html).toContain("Más recientes");
    expect(html).toContain("/publicaciones/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05");
  });

  it("renders selected filters from search params", async () => {
    const html = renderToStaticMarkup(
      await PublicationsPage({
        searchParams: Promise.resolve({
          q: "gobierno",
          language: "es",
          subject: "unesco:1203",
          contributorId: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01",
          collectionId: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08",
          sort: "titleAsc",
        }),
      }),
    );

    expect(html).toContain('value="gobierno"');
    expect(html).toContain('<option value="es" selected="">Español</option>');
    expect(html).toContain(
      '<option value="unesco:1203" selected="">Ciencia de los ordenadores</option>',
    );
    expect(html).toContain(
      '<option value="018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01" selected="">Juana Perez Rodriguez</option>',
    );
    expect(html).toContain(
      '<option value="018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08" selected="">Arquitectura y gobierno universitario (UH-AGU)</option>',
    );
    expect(html).toContain('<option value="titleAsc" selected="">Título A-Z</option>');
    expect(html).toContain("Filtros activos");
    expect(html).toContain("Búsqueda:");
    expect(html).toContain("<span>gobierno</span>");
    expect(html).toContain("Materia:");
    expect(html).toContain("<span>Ciencia de los ordenadores</span>");
    expect(html).toContain("Orden:");
    expect(html).toContain("<span>Título A-Z</span>");
    expect(html).toContain(
      'href="/publicaciones?subject=unesco%3A1203&amp;contributorId=018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01&amp;collectionId=018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08&amp;language=es&amp;sort=titleAsc"',
    );
    expect(html).toContain('href="/publicaciones">Limpiar todo</a>');
  });

  it("ignores empty filter fields submitted by the catalog form", async () => {
    const html = renderToStaticMarkup(
      await PublicationsPage({
        searchParams: Promise.resolve({
          q: "",
          publisherId: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
          subject: "",
          contributorId: "",
          collectionId: "",
          language: "",
          sort: "publicationDateDesc",
        }),
      }),
    );

    expect(html).toContain("Publicaciones universitarias");
    expect(html).toContain("1 resultado");
    expect(html).toContain("Editorial Universidad de La Habana");
  });
});
