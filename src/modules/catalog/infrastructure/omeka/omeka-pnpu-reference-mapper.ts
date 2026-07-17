import {
  Collection,
  CONTRIBUTOR_ROLES,
  Contributor,
  ContributorRole,
  Publisher,
  Subject,
  University,
} from "../../domain";
import { DomainValidationError } from "../../domain/errors/domain-validation-error";
import { Orcid, PnpuUuid } from "../../domain/value-objects";
import { OmekaJsonObject } from "./omeka-api-client";
import {
  readFirstLinkedResourceId,
  readFirstLiteral,
  readFirstUri,
  readLinkedResourceIds,
  readLiterals,
  readOmekaId,
  readUris,
} from "./omeka-json-reader";
import { OmekaQualityReport } from "./omeka-quality-report";
import { OMEKA_PNPU_RESOURCE_TEMPLATES } from "./omeka-resource-template-classifier";

export interface OmekaReferenceMappingContext {
  readonly universitiesByOmekaId?: ReadonlyMap<number, University>;
  readonly publishersByOmekaId?: ReadonlyMap<number, Publisher>;
  readonly subjectsByOmekaId?: ReadonlyMap<number, Subject>;
}

export function mapOmekaSubject(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): Subject | null {
  const identifier =
    readFirstLiteral(resource, "skos:notation") ?? readFirstLiteral(resource, "dcterms:identifier");
  const preferredLabel = readFirstLiteral(resource, "skos:prefLabel");

  if (identifier === null) {
    rejectMissing(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.subject, "skos:notation");
    return null;
  }

  if (preferredLabel === null) {
    rejectMissing(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.subject, "skos:prefLabel");
    return null;
  }

  return createOrReject(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.subject, "subject", () =>
    Subject.create({
      identifier,
      preferredLabel,
      uri: readFirstUri(resource, "schema:url") ?? undefined,
      broader: readFirstUri(resource, "skos:broader") ?? undefined,
      related: optionalArray(readUris(resource, "skos:related")),
    }),
  );
}

export function mapOmekaContributor(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): Contributor | null {
  const uuid = readPnpuUuid(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.contributor);
  const name = readFirstLiteral(resource, "foaf:name") ?? readFirstLiteral(resource, "schema:name");
  const roles = readContributorRoles(resource, quality);

  if (uuid === null) {
    return null;
  }

  if (name === null) {
    rejectMissing(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.contributor, "foaf:name");
    return null;
  }

  if (roles.length === 0) {
    rejectMissing(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.contributor, "schema:roleName");
    return null;
  }

  return createOrReject(
    resource,
    quality,
    OMEKA_PNPU_RESOURCE_TEMPLATES.contributor,
    "contributor",
    () =>
      Contributor.create({
        id: uuid,
        name,
        roles,
        givenName: readFirstLiteral(resource, "foaf:givenName") ?? undefined,
        familyName: readFirstLiteral(resource, "foaf:familyName") ?? undefined,
        orcid: readOrcid(resource, quality) ?? undefined,
        affiliation: readFirstLiteral(resource, "schema:affiliation") ?? undefined,
        biography: readFirstLiteral(resource, "schema:description") ?? undefined,
        country: readFirstLiteral(resource, "schema:nationality") ?? undefined,
      }),
  );
}

export function mapOmekaUniversity(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): University | null {
  const uuid = readPnpuUuid(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.university);
  const officialName = readFirstLiteral(resource, "schema:name");
  const country = readFirstLiteral(resource, "schema:addressCountry");

  if (uuid === null) {
    return null;
  }

  if (officialName === null) {
    rejectMissing(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.university, "schema:name");
    return null;
  }

  if (country === null) {
    rejectMissing(
      resource,
      quality,
      OMEKA_PNPU_RESOURCE_TEMPLATES.university,
      "schema:addressCountry",
    );
    return null;
  }

  return createOrReject(
    resource,
    quality,
    OMEKA_PNPU_RESOURCE_TEMPLATES.university,
    "university",
    () =>
      University.create({
        id: uuid,
        officialName,
        acronym: readFirstLiteral(resource, "schema:alternateName") ?? undefined,
        universityCode: readFirstLiteral(resource, "pnpu:universityCode") ?? undefined,
        province: readFirstLiteral(resource, "schema:addressLocality") ?? undefined,
        country,
        website: readFirstUri(resource, "schema:url") ?? undefined,
      }),
  );
}

export function mapOmekaPublisher(
  resource: OmekaJsonObject,
  context: OmekaReferenceMappingContext,
  quality: OmekaQualityReport,
): Publisher | null {
  const uuid = readPnpuUuid(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.publisher);
  const officialName =
    readFirstLiteral(resource, "schema:name") ?? readFirstLiteral(resource, "dcterms:title");
  const country = readFirstLiteral(resource, "schema:addressCountry");
  const universityId = readFirstLinkedResourceId(resource, "schema:parentOrganization");
  const university =
    universityId === null ? undefined : context.universitiesByOmekaId?.get(universityId);

  if (uuid === null) {
    return null;
  }

  if (officialName === null) {
    rejectMissing(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.publisher, "schema:name");
    return null;
  }

  if (country === null) {
    rejectMissing(
      resource,
      quality,
      OMEKA_PNPU_RESOURCE_TEMPLATES.publisher,
      "schema:addressCountry",
    );
    return null;
  }

  if (university === undefined) {
    rejectUnresolved(
      resource,
      quality,
      OMEKA_PNPU_RESOURCE_TEMPLATES.publisher,
      "schema:parentOrganization",
    );
    return null;
  }

  return createOrReject(
    resource,
    quality,
    OMEKA_PNPU_RESOURCE_TEMPLATES.publisher,
    "publisher",
    () =>
      Publisher.create({
        id: uuid,
        officialName,
        acronym: readFirstLiteral(resource, "schema:alternateName") ?? undefined,
        publisherCode: readFirstLiteral(resource, "pnpu:publisherCode") ?? undefined,
        description: readFirstLiteral(resource, "dcterms:description") ?? undefined,
        university,
        province: readFirstLiteral(resource, "schema:addressLocality") ?? undefined,
        country,
        website: readFirstUri(resource, "schema:url") ?? undefined,
        logo: readFirstUri(resource, "schema:logo") ?? undefined,
        contactPoint: {
          email: readFirstLiteral(resource, "schema:email") ?? undefined,
          telephone: readFirstLiteral(resource, "schema:telephone") ?? undefined,
          url: readFirstUri(resource, "schema:contactPoint") ?? undefined,
        },
      }),
  );
}

export function mapOmekaCollection(
  resource: OmekaJsonObject,
  context: OmekaReferenceMappingContext,
  quality: OmekaQualityReport,
): Collection | null {
  const uuid = readPnpuUuid(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.collection);
  const title = readFirstLiteral(resource, "dcterms:title");
  const publisherId = readFirstLinkedResourceId(resource, "dcterms:publisher");
  const publisher =
    publisherId === null ? undefined : context.publishersByOmekaId?.get(publisherId);
  const subjects = readLinkedResourceIds(resource, "dcterms:subject")
    .map((subjectId) => context.subjectsByOmekaId?.get(subjectId))
    .filter((subject): subject is Subject => subject !== undefined);

  if (uuid === null) {
    return null;
  }

  if (title === null) {
    rejectMissing(resource, quality, OMEKA_PNPU_RESOURCE_TEMPLATES.collection, "dcterms:title");
    return null;
  }

  if (publisher === undefined) {
    rejectUnresolved(
      resource,
      quality,
      OMEKA_PNPU_RESOURCE_TEMPLATES.collection,
      "dcterms:publisher",
    );
    return null;
  }

  return createOrReject(
    resource,
    quality,
    OMEKA_PNPU_RESOURCE_TEMPLATES.collection,
    "collection",
    () =>
      Collection.create({
        id: uuid,
        title,
        publisher,
        description: readFirstLiteral(resource, "dcterms:description") ?? undefined,
        collectionCode: readFirstLiteral(resource, "pnpu:collectionCode") ?? undefined,
        editorialSeries: readFirstLiteral(resource, "pnpu:editorialSeries") ?? undefined,
        subjects: optionalArray(subjects),
      }),
  );
}

function readPnpuUuid(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  templateLabel: string,
): PnpuUuid | null {
  const uuid = readFirstLiteral(resource, "pnpu:uuid");

  if (uuid === null) {
    rejectMissing(resource, quality, templateLabel, "pnpu:uuid");
    return null;
  }

  try {
    return PnpuUuid.create(uuid);
  } catch (error) {
    rejectInvalid(resource, quality, templateLabel, "pnpu:uuid", error);
    return null;
  }
}

function readContributorRoles(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
): readonly ContributorRole[] {
  const roles = readLiterals(resource, "schema:roleName")
    .map((role) => role.trim())
    .filter((role): role is ContributorRole => CONTRIBUTOR_ROLES.includes(role as ContributorRole));
  const invalidRoles = readLiterals(resource, "schema:roleName").filter(
    (role) => !CONTRIBUTOR_ROLES.includes(role.trim() as ContributorRole),
  );

  for (const role of invalidRoles) {
    quality.warn({
      code: "OMEKA_INVALID_VALUE",
      omekaId: readOmekaId(resource),
      templateLabel: OMEKA_PNPU_RESOURCE_TEMPLATES.contributor,
      field: "schema:roleName",
      message: `Contributor role "${role}" is not supported by the PNPU domain.`,
    });
  }

  return [...new Set(roles)];
}

function readOrcid(resource: OmekaJsonObject, quality: OmekaQualityReport): Orcid | null {
  const value =
    readFirstUri(resource, "schema:sameAs") ?? readFirstLiteral(resource, "schema:sameAs");

  if (value === null) {
    return null;
  }

  try {
    return Orcid.create(value);
  } catch (error) {
    quality.warn({
      code: "OMEKA_INVALID_VALUE",
      omekaId: readOmekaId(resource),
      templateLabel: OMEKA_PNPU_RESOURCE_TEMPLATES.contributor,
      field: "schema:sameAs",
      message: error instanceof Error ? error.message : "Invalid ORCID value.",
    });
    return null;
  }
}

function createOrReject<T>(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  templateLabel: string,
  entityName: string,
  factory: () => T,
): T | null {
  try {
    return factory();
  } catch (error) {
    if (error instanceof DomainValidationError) {
      rejectInvalid(resource, quality, templateLabel, entityName, error);
      return null;
    }

    throw error;
  }
}

function rejectMissing(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  templateLabel: string,
  field: string,
): void {
  quality.reject({
    code: "OMEKA_MISSING_REQUIRED_FIELD",
    omekaId: readOmekaId(resource),
    templateLabel,
    field,
    message: `Required Omeka field "${field}" is missing.`,
  });
}

function rejectInvalid(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  templateLabel: string,
  field: string,
  error: unknown,
): void {
  quality.reject({
    code: "OMEKA_INVALID_VALUE",
    omekaId: readOmekaId(resource),
    templateLabel,
    field,
    message: error instanceof Error ? error.message : `Invalid Omeka field "${field}".`,
  });
}

function rejectUnresolved(
  resource: OmekaJsonObject,
  quality: OmekaQualityReport,
  templateLabel: string,
  field: string,
): void {
  quality.reject({
    code: "OMEKA_UNRESOLVED_REFERENCE",
    omekaId: readOmekaId(resource),
    templateLabel,
    field,
    message: `Required Omeka reference "${field}" could not be resolved.`,
  });
}

function optionalArray<T>(values: readonly T[]): readonly T[] | undefined {
  return values.length === 0 ? undefined : [...values];
}
