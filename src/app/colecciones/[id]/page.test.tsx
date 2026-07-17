import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CollectionDetailPage, { generateMetadata } from "./page";

const collectionId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08";

describe("CollectionDetailPage", () => {
  it("renders a collection detail page", async () => {
    const html = renderToStaticMarkup(
      await CollectionDetailPage({ params: Promise.resolve({ id: collectionId }) }),
    );

    expect(html).toContain("Arquitectura y gobierno universitario");
    expect(html).toContain("Arquitectura empresarial para universidades");
    expect(html).toContain("UH-AGU");
    expect(html).toContain("Ver publicaciones de la colección");
    expect(html).toContain("/publicaciones?subject=unesco%3A1203");
    expect(html).toContain("Serie editorial");
    expect(html).toContain("book");
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"CollectionPage"');
  });

  it("generates collection metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ id: collectionId }) }),
    ).resolves.toMatchObject({
      title: "Arquitectura y gobierno universitario | PNPU",
      alternates: {
        canonical: `http://127.0.0.1:4307/colecciones/${collectionId}`,
      },
    });
  });
});
