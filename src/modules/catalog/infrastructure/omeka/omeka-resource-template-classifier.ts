import { OmekaJsonObject } from "./omeka-api-client";
import { readOmekaId, readResourceTemplateLabel } from "./omeka-json-reader";

export const OMEKA_PNPU_RESOURCE_TEMPLATES = {
  publication: "PNPU Publication",
  contributor: "PNPU Contributor",
  publisher: "PNPU Publisher",
  university: "PNPU University",
  collection: "PNPU Collection",
  subject: "PNPU Subject",
  digitalResource: "PNPU Digital Resource",
} as const;

export type OmekaPnpuResourceKind = keyof typeof OMEKA_PNPU_RESOURCE_TEMPLATES;

export type OmekaResourceClassification =
  | {
      readonly kind: OmekaPnpuResourceKind;
      readonly omekaId: number | null;
      readonly templateLabel: string;
      readonly resource: OmekaJsonObject;
    }
  | {
      readonly kind: "unknown";
      readonly omekaId: number | null;
      readonly templateLabel: string | null;
      readonly resource: OmekaJsonObject;
    };

const templateToKind = new Map<string, OmekaPnpuResourceKind>(
  Object.entries(OMEKA_PNPU_RESOURCE_TEMPLATES).map(([kind, label]) => [
    label,
    kind as OmekaPnpuResourceKind,
  ]),
);

export function classifyOmekaResource(resource: OmekaJsonObject): OmekaResourceClassification {
  const omekaId = readOmekaId(resource);
  const templateLabel = readResourceTemplateLabel(resource);
  const kind = templateLabel === null ? undefined : templateToKind.get(templateLabel);

  if (kind === undefined || templateLabel === null) {
    return {
      kind: "unknown",
      omekaId,
      templateLabel,
      resource,
    };
  }

  return {
    kind,
    omekaId,
    templateLabel,
    resource,
  };
}

export function classifyOmekaResources(
  resources: readonly OmekaJsonObject[],
): readonly OmekaResourceClassification[] {
  return resources.map(classifyOmekaResource);
}

export function selectOmekaResourcesByKind(
  resources: readonly OmekaJsonObject[],
  kind: OmekaPnpuResourceKind,
): readonly OmekaJsonObject[] {
  return classifyOmekaResources(resources)
    .filter(
      (
        classification,
      ): classification is Extract<OmekaResourceClassification, { kind: typeof kind }> =>
        classification.kind === kind,
    )
    .map((classification) => classification.resource);
}
