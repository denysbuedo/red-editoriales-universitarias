import { describe, expect, it } from "vitest";
import { OmekaCatalogSnapshot } from "./omeka-catalog-snapshot-loader";
import { OmekaResourceClassification } from "./omeka-resource-template-classifier";
import { buildOmekaSnapshotDiagnostics } from "./omeka-snapshot-diagnostics";

describe("buildOmekaSnapshotDiagnostics", () => {
  it("summarizes resources by PNPU template and reports missing templates", () => {
    const snapshot: OmekaCatalogSnapshot = {
      items: [{ "o:id": 1 }, { "o:id": 2 }, { "o:id": 3 }],
      itemSets: [{ "o:id": 10 }],
      media: [{ "o:id": 20 }],
      resourceTemplates: [],
      classifications: [
        knownClassification("publication", 1, "PNPU Publication"),
        knownClassification("contributor", 2, "PNPU Contributor"),
        unknownClassification(3, "Legacy Book"),
        unknownClassification(10, null),
        knownClassification("digitalResource", 20, "PNPU Digital Resource"),
      ],
      quality: {
        issues: [
          {
            severity: "warning",
            code: "OMEKA_UNKNOWN_TEMPLATE",
            omekaId: 3,
            templateLabel: "Legacy Book",
            message: "Omeka Resource Template is not part of the PNPU mapping proposal.",
          },
          {
            severity: "rejected",
            code: "OMEKA_MISSING_REQUIRED_FIELD",
            omekaId: 1,
            templateLabel: "PNPU Publication",
            field: "dcterms:title",
            message: "Publication title is required.",
          },
        ],
        rejectedCount: 1,
        warningCount: 2,
      },
    };

    expect(buildOmekaSnapshotDiagnostics(snapshot)).toEqual({
      totals: {
        items: 3,
        itemSets: 1,
        media: 1,
        resources: 5,
      },
      recognizedByKind: {
        collection: 0,
        contributor: 1,
        digitalResource: 1,
        publication: 1,
        publisher: 0,
        subject: 0,
        university: 0,
      },
      unknown: {
        total: 2,
        withoutTemplate: 1,
        templateLabels: ["Legacy Book"],
      },
      missingPnpuTemplates: [
        "PNPU Publisher",
        "PNPU University",
        "PNPU Collection",
        "PNPU Subject",
      ],
      quality: {
        warnings: 2,
        rejected: 1,
        issues: [
          {
            severity: "warning",
            code: "OMEKA_UNKNOWN_TEMPLATE",
            omekaId: 3,
            templateLabel: "Legacy Book",
            message: "Omeka Resource Template is not part of the PNPU mapping proposal.",
          },
          {
            severity: "rejected",
            code: "OMEKA_MISSING_REQUIRED_FIELD",
            omekaId: 1,
            templateLabel: "PNPU Publication",
            field: "dcterms:title",
            message: "Publication title is required.",
          },
        ],
      },
    });
  });

  it("limits the quality issue sample for operational responses", () => {
    const snapshot: OmekaCatalogSnapshot = {
      items: [],
      itemSets: [],
      media: [],
      resourceTemplates: [],
      classifications: [],
      quality: {
        issues: Array.from({ length: 25 }, (_, index) => ({
          severity: "warning",
          code: "OMEKA_UNKNOWN_TEMPLATE",
          omekaId: index + 1,
          templateLabel: "Legacy Book",
          message: "Omeka Resource Template is not part of the PNPU mapping proposal.",
        })),
        rejectedCount: 0,
        warningCount: 25,
      },
    };

    expect(buildOmekaSnapshotDiagnostics(snapshot).quality.issues).toHaveLength(20);
  });
});

function knownClassification(
  kind: "publication" | "contributor" | "digitalResource",
  omekaId: number,
  templateLabel: string,
): OmekaResourceClassification {
  return {
    kind,
    omekaId,
    templateLabel,
    resource: { "o:id": omekaId },
  } as const;
}

function unknownClassification(
  omekaId: number,
  templateLabel: string | null,
): OmekaResourceClassification {
  return {
    kind: "unknown",
    omekaId,
    templateLabel,
    resource: { "o:id": omekaId },
  };
}
