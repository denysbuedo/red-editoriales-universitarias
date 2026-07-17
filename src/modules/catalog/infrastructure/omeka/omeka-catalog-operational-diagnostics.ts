import { OmekaApiClient, OmekaJsonObject } from "./omeka-api-client";
import { OmekaCatalogSnapshotLoader } from "./omeka-catalog-snapshot-loader";
import {
  buildOmekaInstallationDiagnostics,
  OmekaInstallationDiagnostics,
  OmekaInstallationSnapshot,
} from "./omeka-installation-diagnostics";
import {
  buildOmekaSnapshotDiagnostics,
  OmekaSnapshotDiagnostics,
} from "./omeka-snapshot-diagnostics";

export interface OmekaCatalogOperationalDiagnostics {
  readonly source: "omeka";
  readonly snapshot: OmekaSnapshotDiagnostics;
  readonly installation: OmekaInstallationDiagnostics;
}

export async function buildOmekaCatalogOperationalDiagnostics(
  client: OmekaApiClient,
): Promise<OmekaCatalogOperationalDiagnostics> {
  const [snapshot, vocabularies, properties, resourceTemplates] = await Promise.all([
    new OmekaCatalogSnapshotLoader(client).load(),
    loadAllPages((request) => client.listVocabularies(request)),
    loadAllPages((request) => client.listProperties(request)),
    loadAllPages((request) => client.listResourceTemplates(request)),
  ]);

  return {
    source: "omeka",
    snapshot: buildOmekaSnapshotDiagnostics(snapshot),
    installation: buildOmekaInstallationDiagnostics(
      toInstallationSnapshot(vocabularies, properties, resourceTemplates),
    ),
  };
}

async function loadAllPages(
  operation: (request: {
    readonly page: number;
    readonly pageSize: number;
  }) => Promise<readonly OmekaJsonObject[]>,
): Promise<readonly OmekaJsonObject[]> {
  const pageSize = 100;
  const values: OmekaJsonObject[] = [];

  for (let page = 1; page <= 100; page += 1) {
    const pageValues = await operation({ page, pageSize });
    values.push(...pageValues);

    if (pageValues.length < pageSize) {
      return values;
    }
  }

  return values;
}

function toInstallationSnapshot(
  vocabularies: readonly OmekaJsonObject[],
  properties: readonly OmekaJsonObject[],
  resourceTemplates: readonly OmekaJsonObject[],
): OmekaInstallationSnapshot {
  const propertyTermById = new Map<number, string>();

  for (const property of properties) {
    const id = readInteger(property["o:id"]);
    const term = readString(property["o:term"]);

    if (id !== null && term !== null) {
      propertyTermById.set(id, term);
    }
  }

  return {
    vocabularies: vocabularies
      .map((vocabulary) => ({
        prefix: readString(vocabulary["o:prefix"]),
        namespaceUri: readString(vocabulary["o:namespace_uri"]) ?? "",
      }))
      .filter(
        (vocabulary): vocabulary is { readonly prefix: string; readonly namespaceUri: string } =>
          vocabulary.prefix !== null,
      ),
    properties: properties
      .map((property) => ({ term: readString(property["o:term"]) }))
      .filter((property): property is { readonly term: string } => property.term !== null),
    resourceTemplates: resourceTemplates
      .map((template) => ({
        label: readString(template["o:label"]),
        propertyTerms: readTemplatePropertyTerms(template, propertyTermById),
      }))
      .filter(
        (
          template,
        ): template is { readonly label: string; readonly propertyTerms: readonly string[] } =>
          template.label !== null,
      ),
  };
}

function readTemplatePropertyTerms(
  template: OmekaJsonObject,
  propertyTermById: ReadonlyMap<number, string>,
): readonly string[] {
  const values = template["o:resource_template_property"];

  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      const property = isJsonObject(value) ? value["o:property"] : null;
      const propertyId = isJsonObject(property) ? readInteger(property["o:id"]) : null;

      return propertyId === null ? null : propertyTermById.get(propertyId);
    })
    .filter((term): term is string => term !== null && term !== undefined);
}

function readInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function isJsonObject(value: unknown): value is OmekaJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
