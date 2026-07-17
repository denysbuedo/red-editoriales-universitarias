import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ContributorDetailPage, { generateMetadata } from "./page";

const contributorId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01";

describe("ContributorDetailPage", () => {
  it("renders a contributor detail page", async () => {
    const html = renderToStaticMarkup(
      await ContributorDetailPage({ params: Promise.resolve({ id: contributorId }) }),
    );

    expect(html).toContain("Juana Perez Rodriguez");
    expect(html).toContain("Universidad de La Habana");
    expect(html).toContain("https://orcid.org/0000-0002-1825-0097");
    expect(html).toContain("Ver publicaciones del autor");
    expect(html).toContain("Roles");
    expect(html).toContain("Autor");
    expect(html).toContain("Arquitectura empresarial para universidades");
    expect(html).toContain("/publicaciones?subject=unesco%3A1203");
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Person"');
    expect(html).toContain('"workExample"');
  });

  it("generates contributor metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ id: contributorId }) }),
    ).resolves.toMatchObject({
      title: "Juana Perez Rodriguez | PNPU",
      alternates: {
        canonical: `http://127.0.0.1:4307/autores/${contributorId}`,
      },
      openGraph: {
        type: "profile",
        url: `http://127.0.0.1:4307/autores/${contributorId}`,
      },
    });
  });
});
