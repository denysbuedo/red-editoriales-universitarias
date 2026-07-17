import { OmekaCatalogSnapshot } from "./omeka-catalog-snapshot-loader";
import {
  OMEKA_PNPU_RESOURCE_TEMPLATES,
  OmekaPnpuResourceKind,
  OmekaResourceClassification,
} from "./omeka-resource-template-classifier";

export interface OmekaSnapshotDiagnostics {
  readonly totals: {
    readonly items: number;
    readonly itemSets: number;
    readonly media: number;
    readonly resources: number;
  };
  readonly recognizedByKind: Readonly<Record<OmekaPnpuResourceKind, number>>;
  readonly unknown: {
    readonly total: number;
    readonly withoutTemplate: number;
    readonly templateLabels: readonly string[];
  };
  readonly missingPnpuTemplates: readonly string[];
  readonly quality: {
    readonly warnings: number;
    readonly rejected: number;
  };
}

export function buildOmekaSnapshotDiagnostics(
  snapshot: OmekaCatalogSnapshot,
): OmekaSnapshotDiagnostics {
  const recognizedByKind = createEmptyKindCounts();
  const unknownTemplateLabels = new Set<string>();
  let unknownTotal = 0;
  let withoutTemplate = 0;

  for (const classification of snapshot.classifications) {
    if (classification.kind === "unknown") {
      unknownTotal += 1;

      if (classification.templateLabel === null) {
        withoutTemplate += 1;
      } else {
        unknownTemplateLabels.add(classification.templateLabel);
      }

      continue;
    }

    recognizedByKind[classification.kind] += 1;
  }

  return {
    totals: {
      items: snapshot.items.length,
      itemSets: snapshot.itemSets.length,
      media: snapshot.media.length,
      resources: snapshot.items.length + snapshot.itemSets.length + snapshot.media.length,
    },
    recognizedByKind,
    unknown: {
      total: unknownTotal,
      withoutTemplate,
      templateLabels: [...unknownTemplateLabels].sort((left, right) => left.localeCompare(right)),
    },
    missingPnpuTemplates: findMissingPnpuTemplates(snapshot.classifications),
    quality: {
      warnings: snapshot.quality.warningCount,
      rejected: snapshot.quality.rejectedCount,
    },
  };
}

function createEmptyKindCounts(): Record<OmekaPnpuResourceKind, number> {
  return Object.fromEntries(
    Object.keys(OMEKA_PNPU_RESOURCE_TEMPLATES).map((kind) => [kind, 0]),
  ) as Record<OmekaPnpuResourceKind, number>;
}

function findMissingPnpuTemplates(
  classifications: readonly OmekaResourceClassification[],
): readonly string[] {
  const presentKinds = new Set(
    classifications
      .filter((classification) => classification.kind !== "unknown")
      .map((classification) => classification.kind),
  );

  return Object.entries(OMEKA_PNPU_RESOURCE_TEMPLATES)
    .filter(([kind]) => !presentKinds.has(kind as OmekaPnpuResourceKind))
    .map(([, templateLabel]) => templateLabel);
}
