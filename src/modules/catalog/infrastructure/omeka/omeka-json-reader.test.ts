import { describe, expect, it } from "vitest";

import { OmekaJsonObject } from "./omeka-api-client";
import {
  hasResourceTemplate,
  readFirstLinkedResourceId,
  readFirstLiteral,
  readFirstUri,
  readLinkedResourceIds,
  readLiterals,
  readOmekaId,
  readResourceTemplateLabel,
  readUris,
} from "./omeka-json-reader";

const publicationItem: OmekaJsonObject = {
  "@id": "https://omeka.example.edu/api/items/10",
  "o:id": 10,
  "o:resource_template": {
    "o:id": 2,
    "o:label": "PNPU Publication",
  },
  "dcterms:title": [
    {
      type: "literal",
      property_id: 1,
      property_label: "Title",
      is_public: true,
      "@value": "Arquitectura empresarial para universidades",
    },
  ],
  "dcterms:creator": [
    {
      type: "resource:item",
      value_resource_id: 20,
      "@id": "https://omeka.example.edu/api/items/20",
      display_title: "Juana Perez Rodriguez",
    },
  ],
  "dcterms:subject": [
    {
      type: "resource:item",
      "@id": "https://omeka.example.edu/api/items/30",
      display_title: "Ciencia de los ordenadores",
    },
  ],
  "schema:sameAs": [
    {
      type: "uri",
      "@id": "https://orcid.org/0000-0002-1825-0097",
    },
  ],
};

describe("omeka-json-reader", () => {
  it("reads Omeka ids and resource template labels", () => {
    expect(readOmekaId(publicationItem)).toBe(10);
    expect(readResourceTemplateLabel(publicationItem)).toBe("PNPU Publication");
    expect(hasResourceTemplate(publicationItem, "PNPU Publication")).toBe(true);
    expect(hasResourceTemplate(publicationItem, "PNPU Contributor")).toBe(false);
  });

  it("reads literal values by term", () => {
    expect(readFirstLiteral(publicationItem, "dcterms:title")).toBe(
      "Arquitectura empresarial para universidades",
    );
    expect(readLiterals(publicationItem, "dcterms:title")).toEqual([
      "Arquitectura empresarial para universidades",
    ]);
    expect(readFirstLiteral(publicationItem, "dcterms:missing")).toBeNull();
  });

  it("reads linked resource ids from explicit ids and API URLs", () => {
    expect(readFirstLinkedResourceId(publicationItem, "dcterms:creator")).toBe(20);
    expect(readLinkedResourceIds(publicationItem, "dcterms:subject")).toEqual([30]);
    expect(readFirstLinkedResourceId(publicationItem, "dcterms:missing")).toBeNull();
  });

  it("reads URI values by term", () => {
    expect(readFirstUri(publicationItem, "schema:sameAs")).toBe(
      "https://orcid.org/0000-0002-1825-0097",
    );
    expect(readUris(publicationItem, "schema:sameAs")).toEqual([
      "https://orcid.org/0000-0002-1825-0097",
    ]);
  });

  it("ignores malformed values instead of throwing", () => {
    const malformed: OmekaJsonObject = {
      "o:id": "not-a-number",
      "dcterms:title": [{ "@value": "  " }, null, "invalid"],
      "dcterms:creator": [{ "@id": "https://omeka.example.edu/api/items/not-a-number" }],
    };

    expect(readOmekaId(malformed)).toBeNull();
    expect(readLiterals(malformed, "dcterms:title")).toEqual([]);
    expect(readLinkedResourceIds(malformed, "dcterms:creator")).toEqual([]);
  });
});
