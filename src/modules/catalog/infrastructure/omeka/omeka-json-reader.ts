import { OmekaJsonObject } from "./omeka-api-client";

export interface OmekaValueObject extends OmekaJsonObject {
  readonly "@value"?: unknown;
  readonly "@id"?: unknown;
  readonly "o:label"?: unknown;
  readonly "o:term"?: unknown;
  readonly display_title?: unknown;
  readonly type?: unknown;
  readonly value_resource_id?: unknown;
}

export function readOmekaId(resource: OmekaJsonObject): number | null {
  return readInteger(resource["o:id"]);
}

export function readResourceTemplateLabel(resource: OmekaJsonObject): string | null {
  const template = resource["o:resource_template"];

  if (!isJsonObject(template)) {
    return null;
  }

  return readNonEmptyString(template["o:label"]);
}

export function hasResourceTemplate(resource: OmekaJsonObject, templateLabel: string): boolean {
  return readResourceTemplateLabel(resource) === templateLabel;
}

export function readFirstLiteral(resource: OmekaJsonObject, term: string): string | null {
  return readLiterals(resource, term)[0] ?? null;
}

export function readLiterals(resource: OmekaJsonObject, term: string): readonly string[] {
  return readValueObjects(resource, term)
    .map((value) => readNonEmptyString(value["@value"]))
    .filter((value): value is string => value !== null);
}

export function readFirstLinkedResourceId(resource: OmekaJsonObject, term: string): number | null {
  return readLinkedResourceIds(resource, term)[0] ?? null;
}

export function readLinkedResourceIds(resource: OmekaJsonObject, term: string): readonly number[] {
  return readValueObjects(resource, term)
    .map(readLinkedResourceId)
    .filter((value): value is number => value !== null);
}

export function readFirstUri(resource: OmekaJsonObject, term: string): string | null {
  return readUris(resource, term)[0] ?? null;
}

export function readUris(resource: OmekaJsonObject, term: string): readonly string[] {
  return readValueObjects(resource, term)
    .map((value) => readNonEmptyString(value["@id"]))
    .filter((value): value is string => value !== null);
}

export function readValueObjects(
  resource: OmekaJsonObject,
  term: string,
): readonly OmekaValueObject[] {
  const values = resource[term];

  if (!Array.isArray(values)) {
    return [];
  }

  return values.filter(isOmekaValueObject);
}

function readLinkedResourceId(value: OmekaValueObject): number | null {
  const explicitId = readInteger(value.value_resource_id);

  if (explicitId !== null) {
    return explicitId;
  }

  const id = readNonEmptyString(value["@id"]);

  if (id === null) {
    return null;
  }

  const match = /\/api\/(?:items|item_sets)\/(\d+)$/.exec(id);

  return match === null ? null : readInteger(match[1]);
}

function readInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function isOmekaValueObject(value: unknown): value is OmekaValueObject {
  return isJsonObject(value);
}

function isJsonObject(value: unknown): value is OmekaJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
