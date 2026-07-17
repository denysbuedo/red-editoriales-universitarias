import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JsonLdScript, serializeJsonLd } from "./json-ld";

describe("JsonLdScript", () => {
  it("serializes JSON-LD safely", () => {
    expect(
      serializeJsonLd({
        "@context": "https://schema.org",
        name: "<script>alert(1)</script>",
      }),
    ).toContain("\\u003cscript>");
  });

  it("renders an application/ld+json script", () => {
    const html = renderToStaticMarkup(
      <JsonLdScript
        data={{
          "@context": "https://schema.org",
          "@type": "Book",
          name: "Arquitectura empresarial para universidades",
        }}
        id="publication-jsonld"
      />,
    );

    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"@type":"Book"');
  });
});
