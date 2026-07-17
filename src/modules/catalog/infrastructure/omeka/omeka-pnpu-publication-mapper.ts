import {
  Collection,
  Contributor,
  Identifier,
  Publication,
  PUBLICATION_TYPES,
  PublicationType,
  Publisher,
  RESOURCE_TYPES,
  Resource,
  ResourceType,
  Subject,
} from "../../domain";
import { DomainValidationError } from "../../domain/errors/domain-validation-error";
import { LanguageCode, PnpuUuid } from "../../domain/value-objects";
import { OmekaJsonObject } from "./omeka-api-client";
import {
  readFirstLinkedResourceId,
  readFirstLiteral,
  readFirstUri,
  readLinkedResourceIds,
  readLiterals,
  readOmekaId,
} from "./omeka-json-reader";
import { OmekaQualityReport } from "./omeka-quality-report";
import { OMEKA_PNPU_RESOURCE_TEMPLATES } from "./omeka-resource-template-classifier";

export interface OmekaPublicationMappingContext {
  readonly publishersByOmekaId: ReadonlyMap<number, Publisher>;
  readonly contributorsByOmekaId: ReadonlyMap<number, Contributor>;
  readonly subjectsByOmekaId: ReadonlyMap<number, Subject>;
  readonly collectionsByOmekaId?: ReadonlyMap<number, Collection>;
  readonly mediaByItemOmekaId: ReadonlyMap<number, readonly OmekaJsonObject[]>;
}

export function mapOmekaPublication(
  resource: OmekaJsonObject,
  context: OmekaPublicationMappingContext,
  quality: OmekaQualityReport,
): Publication | null {
  const uuid = readPnpuUuid(resource, quality);
  const title = readFirstLiteral(resource, "dcterms:title");
  const publicationDate = readFirstLiteral(resource, "dcterms:issued");
  const language = readLanguage(resource, quality);
  const type = readPublicationType(resource, quality);
  const format = readFirstLiteral(resource, "dcterms:format");
  const publisher = readPublisher(resource, context, quality);
  const contributors = readContributors(resource, context, quality);
  const subjects = readSubjects(resource, context, quality);
  const identifiers = readIdentifiers(resource, quality);
  const resources = readResources(resource, context, quality);
  const collection = readCollection(resource, context);

  if (uuid === null) return null;
  if (title === null) return rejectMissing(resource, quality, "dcterms:title");
  if (publicationDate === null) return rejectMissing(resource, quality, "dcterms:issued");
  if (language === null) return null;
  if (type === null) return null;
  if (format === null) return rejectMissing(resource, quality, "dcterms:format");
  if (publisher === null) return null;
  if (contributors.length === 0) return rejectUnresolved(resource, quality, "dcterms:creator");
  if (subjects.length === 0) return rejectUnresolved(resource, quality, "dcterms:subject");
  if (identifiers.length === 0) return rejectMissing(resource, quality, "dcterms:identifier");
  if (resources.length === 0) return rejectUnresolved(resource, quality, "media");

  return createOrReject(resource, quality, "publication", () =>
    Publication.create({
      id: uuid,
      title,
      subtitle: readFirstLiteral(resource, "dcterms:alternative") ?? undefined,
      abstract: readFirstLiteral(resource, "dcterms:abstract") ?? undefined,
      publicationDate,
      language,
      publisher,
      contributors,
      identifiers,
      subjects,
      resources,
      type,
      format,
      keywords: optionalArray(readLiterals(resource, "schema:keywords")),
      license:
        readFirstLiteral(resource, "dcterms:license") ??
        readFirstUri(resource, "dcterms:license") ??
        undefined,
      collection,
    }),
  );
}

export function mapOmekaDigitalResource(
  media: OmekaJsonObject,
  quality: OmekaQualityReport,
): Resource | null {
  const type = readResourceType(media, quality);
  const url =
    readFirstUri(media, "o:original_url") ??
    readFirstLiteral(media, "o:original_url") ??
    readFirstLiteral(media, "o:source") ??
    readTopLevelString(media, "o:source");
  const format =
    readFirstLiteral(media, "dcterms:format") ?? readFirstLiteral(media, "o:media_type");
  const language = readOptionalLanguage(media, quality);
  const fileSize = readOptionalInteger(media, "pnpu:fileSize", quality);

  if (type === null) return null;
  if (url === null) return rejectMediaMissing(media, quality, "o:original_url");
  if (format === null) return rejectMediaMissing(media, quality, "dcterms:format");
  if (language === null && readFirstLiteral(media, "dcterms:language") !== null) return null;
  if (fileSize === null && readFirstLiteral(media, "pnpu:fileSize") !== null) return null;

  return createOrReject(media, quality, "resource", () =>
    Resource.create({
      type,
      url,
      format,
      fileSize: fileSize ?? undefined,
      checksum: readFirstLiteral(media, "pnpu:checksum") ?? undefined,
      language: language ?? undefined,
      license:
        readFirstLiteral(media, "dcterms:license") ??
        readFirstUri(media, "dcterms:license") ??
        undefined,
    }),
  );
}

function readPnpuUuid(resource: OmekaJsonObject, quality: OmekaQualityReport): PnpuUuid | null {
  const uuid = readFirstLiteral(resource, "pnpu:uuid");

  if (uuid === null) {
    rejectMissing(resource, quality, "pnpu:uuid");
    return null;
  }

  try {
    return PnpuUuid.create(uuid);
  } catch (error) {
    rejectInvalid(resource, quality, "pnpu:uuid", error);
    return null;
  }
}

function readLanguage(resource: OmekaJsonObject, quality: OmekaQualityReport): LanguageCode | null {
  const language = readFirstLiteral(resource, "dcterms:language");

  if (language === null) {
    rejectMissing(resource, quality, "dcterms:language");
    return null;
  }

  try {
    return LanguageCode.create(language);
  } catch (error) {
    rejectInvalid(resource, quality, "dcterms:language", error);
    return null;
  }
}

function readOptionalLanguage(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): LanguageCode | undefined | null {
  const language = readFirstLiteral(resource, "dcterms:language");

  if (language === null) {
    return undefined;
  }

  try {
    return LanguageCode.create(language);
  } catch (error) {
    rejectInvalid(resource, quality, "dcterms:language", error);
    return null;
  }
}

function readPublicationType(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): PublicationType | null {
  const type = readFirstLiteral(resource, "dcterms:type");

  if (type === null) {
    rejectMissing(resource, quality, "dcterms:type");
    return null;
  }

  if (!PUBLICATION_TYPES.includes(type as PublicationType)) {
    rejectInvalid(
      resource,
      quality,
      "dcterms:type",
      new Error(`Publication type "${type}" is not supported.`),
    );
    return null;
  }

  return type as PublicationType;
}

function readResourceType(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): ResourceType | null {
  const explicitType = readFirstLiteral(resource, "pnpu:resourceType");
  const mediaType = readFirstLiteral(resource, "o:media_type");
  const type = explicitType ?? inferResourceType(mediaType);

  if (type === null) {
    rejectMediaMissing(resource, quality, "pnpu:resourceType");
    return null;
  }

  if (!RESOURCE_TYPES.includes(type as ResourceType)) {
    rejectInvalid(
      resource,
      quality,
      "pnpu:resourceType",
      new Error(`Resource type "${type}" is not supported.`),
    );
    return null;
  }

  return type as ResourceType;
}

function inferResourceType(mediaType: string | null): ResourceType | null {
  if (mediaType === null) {
    return null;
  }

  if (mediaType === "application/pdf") return "pdf";
  if (mediaType === "application/epub+zip") return "epub";
  if (mediaType.startsWith("audio/")) return "audio";
  if (mediaType.startsWith("video/")) return "video";
  if (mediaType === "text/html") return "html";

  return null;
}

function readPublisher(
  resource: OmekaJsonObject,
  context: OmekaPublicationMappingContext,
  quality: OmekaQualityReport,
): Publisher | null {
  const publisherId = readFirstLinkedResourceId(resource, "dcterms:publisher");
  const publisher = publisherId === null ? undefined : context.publishersByOmekaId.get(publisherId);

  if (publisher === undefined) {
    rejectUnresolved(resource, quality, "dcterms:publisher");
    return null;
  }

  return publisher;
}

function readContributors(
  resource: OmekaJsonObject,
  context: OmekaPublicationMappingContext,
  quality: OmekaQualityReport,
): readonly Contributor[] {
  const ids = [
    ...readLinkedResourceIds(resource, "dcterms:creator"),
    ...readLinkedResourceIds(resource, "dcterms:contributor"),
  ];
  const contributors = ids
    .map((id) => context.contributorsByOmekaId.get(id))
    .filter((contributor): contributor is Contributor => contributor !== undefined);

  if (contributors.length === 0 && ids.length > 0) {
    rejectUnresolved(resource, quality, "dcterms:creator");
  }

  return [...new Set(contributors)];
}

function readSubjects(
  resource: OmekaJsonObject,
  context: OmekaPublicationMappingContext,
  quality: OmekaQualityReport,
): readonly Subject[] {
  const ids = readLinkedResourceIds(resource, "dcterms:subject");
  const subjects = ids
    .map((id) => context.subjectsByOmekaId.get(id))
    .filter((subject): subject is Subject => subject !== undefined);

  if (subjects.length === 0 && ids.length > 0) {
    rejectUnresolved(resource, quality, "dcterms:subject");
  }

  return [...new Set(subjects)];
}

function readIdentifiers(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): readonly Identifier[] {
  const identifiers: Identifier[] = [];

  for (const value of readLiterals(resource, "dcterms:identifier")) {
    pushIdentifier(identifiers, "uri", value, resource, quality);
  }

  for (const value of readLiterals(resource, "bibo:isbn")) {
    pushIdentifier(identifiers, "isbn", value, resource, quality);
  }

  for (const value of readLiterals(resource, "bibo:doi")) {
    pushIdentifier(identifiers, "doi", value, resource, quality);
  }

  const uuid = readFirstLiteral(resource, "pnpu:uuid");
  if (uuid !== null) {
    pushIdentifier(identifiers, "pnpuUuid", uuid, resource, quality);
  }

  return identifiers;
}

function pushIdentifier(
  identifiers: Identifier[],
  type: "uri" | "isbn" | "doi" | "pnpuUuid",
  value: string,
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): void {
  try {
    identifiers.push(Identifier.create(type, value));
  } catch (error) {
    quality.warn({
      code: "OMEKA_INVALID_VALUE",
      omekaId: readOmekaId(resource),
      templateLabel: OMEKA_PNPU_RESOURCE_TEMPLATES.publication,
      field: type,
      message: error instanceof Error ? error.message : "Invalid identifier.",
    });
  }
}

function readResources(
  resource: OmekaJsonObject,
  context: OmekaPublicationMappingContext,
  quality: OmekaQualityReport,
): readonly Resource[] {
  const omekaId = readOmekaId(resource);
  const media = omekaId === null ? [] : (context.mediaByItemOmekaId.get(omekaId) ?? []);

  return media
    .map((mediaResource) => mapOmekaDigitalResource(mediaResource, quality))
    .filter((digitalResource): digitalResource is Resource => digitalResource !== null);
}

function readCollection(
  resource: OmekaJsonObject,
  context: OmekaPublicationMappingContext,
): Collection | undefined {
  const collectionId = readFirstLinkedResourceId(resource, "dcterms:isPartOf");

  return collectionId === null ? undefined : context.collectionsByOmekaId?.get(collectionId);
}

function readOptionalInteger(
  resource: OmekaJsonObject,
  term: string,
  quality: OmekaQualityReport,
): number | undefined | null {
  const value = readFirstLiteral(resource, term);

  if (value === null) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    rejectInvalid(resource, quality, term, new Error(`${term} must be a non-negative integer.`));
    return null;
  }

  return parsedValue;
}

function readTopLevelString(resource: OmekaJsonObject, field: string): string | null {
  const value = resource[field];

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function createOrReject<T>(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  field: string,
  factory: () => T,
): T | null {
  try {
    return factory();
  } catch (error) {
    if (error instanceof DomainValidationError) {
      rejectInvalid(resource, quality, field, error);
      return null;
    }

    throw error;
  }
}

function rejectMissing(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  field: string,
): null {
  quality.reject({
    code: "OMEKA_MISSING_REQUIRED_FIELD",
    omekaId: readOmekaId(resource),
    templateLabel: OMEKA_PNPU_RESOURCE_TEMPLATES.publication,
    field,
    message: `Required Omeka field "${field}" is missing.`,
  });
  return null;
}

function rejectMediaMissing(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  field: string,
): null {
  quality.reject({
    code: "OMEKA_MISSING_REQUIRED_FIELD",
    omekaId: readOmekaId(resource),
    templateLabel: OMEKA_PNPU_RESOURCE_TEMPLATES.digitalResource,
    field,
    message: `Required Omeka media field "${field}" is missing.`,
  });
  return null;
}

function rejectInvalid(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  field: string,
  error: unknown,
): void {
  quality.reject({
    code: "OMEKA_INVALID_VALUE",
    omekaId: readOmekaId(resource),
    templateLabel: OMEKA_PNPU_RESOURCE_TEMPLATES.publication,
    field,
    message: error instanceof Error ? error.message : `Invalid Omeka field "${field}".`,
  });
}

function rejectUnresolved(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  field: string,
): null {
  quality.reject({
    code: "OMEKA_UNRESOLVED_REFERENCE",
    omekaId: readOmekaId(resource),
    templateLabel: OMEKA_PNPU_RESOURCE_TEMPLATES.publication,
    field,
    message: `Required Omeka reference "${field}" could not be resolved.`,
  });
  return null;
}

function optionalArray<T>(values: readonly T[]): readonly T[] | undefined {
  return values.length === 0 ? undefined : [...values];
}
