import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PublicationDetailPage, { generateMetadata } from "./page";

const publicationId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05";

describe("PublicationDetailPage", () => {
  it("renders a publication detail page", async () => {
    const html = renderToStaticMarkup(
      await PublicationDetailPage({ params: Promise.resolve({ id: publicationId }) }),
    );

    expect(html).toContain("Arquitectura empresarial para universidades");
    expect(html).toContain("Gobierno, integración y sostenibilidad tecnológica");
    expect(html).toContain("gobierno de datos");
    expect(html).toContain("Juana Perez Rodriguez");
    expect(html).toContain(`/autores/018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01`);
    expect(html).toContain("https://orcid.org/0000-0002-1825-0097");
    expect(html).toContain("9789590000003");
    expect(html).toContain("Citación");
    expect(html).toContain("Ciencia de los ordenadores");
    expect(html).toContain("d41d8cd98f00b204e9800998ecf8427e");
    expect(html).toContain("ID PNPU");
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Book"');
    expect(html).toContain('"isbn":"9789590000003"');
    expect(html).toContain('"@type":"DefinedTerm"');
  });

  it("generates publication metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ id: publicationId }) }),
    ).resolves.toMatchObject({
      title: "Arquitectura empresarial para universidades | PNPU",
      alternates: {
        canonical: `http://127.0.0.1:4307/publicaciones/${publicationId}`,
      },
      openGraph: {
        type: "book",
        url: `http://127.0.0.1:4307/publicaciones/${publicationId}`,
      },
    });
  });
});
