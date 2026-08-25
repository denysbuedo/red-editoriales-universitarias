import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PublisherDetailPage, { generateMetadata } from "./page";

const publisherId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03";

describe("PublisherDetailPage", () => {
  it("renders a publisher detail page", async () => {
    const html = renderToStaticMarkup(
      await PublisherDetailPage({ params: Promise.resolve({ id: publisherId }) }),
    );

    expect(html).toContain("Editorial Universidad de La Habana");
    expect(html).toContain("Universidad de La Habana");
    expect(html).toContain("RNEU-UH");
    expect(html).toContain("editorial@uh.cu");
    expect(html).toContain("Entidad responsable");
    expect(html).toContain("Información editorial");
    expect(html).toContain("Materias");
    expect(html).toContain("País");
    expect(html).not.toContain("Datos institucionales");
    expect(html).not.toContain("Contacto y enlaces");
    expect(html).not.toContain("ID PNPU editorial");
    expect(html).not.toContain("ID PNPU universidad");
    expect(html).not.toContain("Sigla universitaria");
    expect(html).not.toContain("Código institucional");
    expect(html).not.toContain("Resumen institucional");
    expect(html).not.toContain("Logo de Editorial Universidad de La Habana");
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Organization"');
    expect(html).not.toContain('"@type":"CollegeOrUniversity"');
    expect(html).toContain('"contactType":"institutional"');
  });

  it("generates publisher metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ id: publisherId }) }),
    ).resolves.toMatchObject({
      title: "Editorial Universidad de La Habana | PNPU",
      alternates: {
        canonical: `http://127.0.0.1:4307/editoriales/${publisherId}`,
      },
      openGraph: {
        type: "website",
        url: `http://127.0.0.1:4307/editoriales/${publisherId}`,
      },
    });
  });
});
