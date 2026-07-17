import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SubjectDetailPage, { generateMetadata } from "./page";

const encodedSubjectIdentifier = "unesco%3A1203";

describe("SubjectDetailPage", () => {
  it("renders a subject detail page", async () => {
    const html = renderToStaticMarkup(
      await SubjectDetailPage({
        params: Promise.resolve({ identifier: encodedSubjectIdentifier }),
      }),
    );

    expect(html).toContain("Ciencia de los ordenadores");
    expect(html).toContain("Materia normalizada del vocabulario público PNPU");
    expect(html).toContain("Ver catálogo filtrado");
    expect(html).toContain("Identificador");
    expect(html).toContain("Arquitectura empresarial para universidades");
    expect(html).toContain("https://pnpu.mes.gob.cu/vocabularies/subjects/1203");
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"DefinedTerm"');
    expect(html).toContain('"termCode":"unesco:1203"');
  });

  it("generates subject metadata", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ identifier: encodedSubjectIdentifier }) }),
    ).resolves.toMatchObject({
      title: "Ciencia de los ordenadores | PNPU",
      alternates: {
        canonical: `http://127.0.0.1:4307/materias/${encodedSubjectIdentifier}`,
      },
    });
  });
});
