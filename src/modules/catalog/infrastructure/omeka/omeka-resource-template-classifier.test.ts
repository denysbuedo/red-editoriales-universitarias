import { describe, expect, it } from "vitest";

import { OmekaJsonObject } from "./omeka-api-client";
import {
  classifyOmekaResource,
  classifyOmekaResources,
  OMEKA_PNPU_RESOURCE_TEMPLATES,
  selectOmekaResourcesByKind,
} from "./omeka-resource-template-classifier";

function omekaResource(id: number, templateLabel: string): OmekaJsonObject {
  return {
    "o:id": id,
    "o:resource_template": {
      "o:label": templateLabel,
    },
  };
}

describe("omeka-resource-template-classifier", () => {
  it("classifies PNPU resource templates", () => {
    expect(
      classifyOmekaResource(omekaResource(10, OMEKA_PNPU_RESOURCE_TEMPLATES.publication)),
    ).toMatchObject({
      kind: "publication",
      omekaId: 10,
      templateLabel: "PNPU Publication",
    });
    expect(
      classifyOmekaResource(omekaResource(20, OMEKA_PNPU_RESOURCE_TEMPLATES.contributor)),
    ).toMatchObject({
      kind: "contributor",
      omekaId: 20,
      templateLabel: "PNPU Contributor",
    });
  });

  it("classifies unknown or missing templates without throwing", () => {
    expect(classifyOmekaResource(omekaResource(99, "Other Template"))).toMatchObject({
      kind: "unknown",
      omekaId: 99,
      templateLabel: "Other Template",
    });
    expect(classifyOmekaResource({ "o:id": 100 })).toMatchObject({
      kind: "unknown",
      omekaId: 100,
      templateLabel: null,
    });
  });

  it("classifies resource batches and selects resources by kind", () => {
    const resources = [
      omekaResource(10, OMEKA_PNPU_RESOURCE_TEMPLATES.publication),
      omekaResource(20, OMEKA_PNPU_RESOURCE_TEMPLATES.contributor),
      omekaResource(30, "Other Template"),
    ];

    expect(classifyOmekaResources(resources).map((classification) => classification.kind)).toEqual([
      "publication",
      "contributor",
      "unknown",
    ]);
    expect(selectOmekaResourcesByKind(resources, "publication")).toEqual([resources[0]]);
  });
});
