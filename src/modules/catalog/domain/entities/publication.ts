import { DomainValidationError } from "../errors/domain-validation-error";
import { LanguageCode, PnpuUuid } from "../value-objects";
import { Collection } from "./collection";
import { Contributor } from "./contributor";
import { Identifier } from "./identifier";
import {
  normalizeOptionalText,
  normalizeOptionalUrl,
  requireDefined,
  requireNonEmptyText,
} from "./domain-guards";
import { Publisher } from "./publisher";
import { Resource } from "./resource";
import { Subject } from "./subject";

export const PUBLICATION_TYPES = [
  "book",
  "ebook",
  "manual",
  "monograph",
  "conferenceProceedings",
  "technicalReport",
  "dataset",
  "openEducationalResource",
  "podcast",
  "video",
  "thesis",
  "journal",
  "bookChapter",
] as const;

export type PublicationType = (typeof PUBLICATION_TYPES)[number];

const ISBN_REQUIRED_PUBLICATION_TYPES = [
  "book",
  "ebook",
  "manual",
  "monograph",
  "conferenceProceedings",
  "bookChapter",
] as const satisfies readonly PublicationType[];

export interface PublicationProps {
  readonly id: PnpuUuid;
  readonly title: string;
  readonly publicationDate: string;
  readonly language: LanguageCode;
  readonly publisher: Publisher;
  readonly contributors: readonly Contributor[];
  readonly identifiers: readonly Identifier[];
  readonly subjects: readonly Subject[];
  readonly resources: readonly Resource[];
  readonly type: PublicationType;
  readonly format: string;
  readonly subtitle?: string;
  readonly abstract?: string;
  readonly keywords?: readonly string[];
  readonly license?: string;
  readonly collection?: Collection;
  readonly coverImageUrl?: string;
}

export class Publication {
  private constructor(private readonly props: PublicationProps) {}

  public static create(props: PublicationProps): Publication {
    return new Publication({
      id: props.id,
      title: requireNonEmptyText(props.title, "Publication title"),
      publicationDate: requireIsoDate(props.publicationDate),
      language: requireDefined(props.language, "Publication language"),
      publisher: requireDefined(props.publisher, "Publication publisher"),
      contributors: requireNonEmptyArray(props.contributors, "Publication contributors"),
      identifiers: requirePublicationIdentifiers(props.identifiers, props.type),
      subjects: requireNonEmptyArray(props.subjects, "Publication subjects"),
      resources: requireNonEmptyArray(props.resources, "Publication resources"),
      type: props.type,
      format: requireNonEmptyText(props.format, "Publication format"),
      subtitle: normalizeOptionalText(props.subtitle),
      abstract: requireNonEmptyText(props.abstract ?? "", "Publication abstract"),
      keywords: requireKeywords(props.keywords),
      license: requireNonEmptyText(props.license ?? "", "Publication license"),
      collection: props.collection,
      coverImageUrl: normalizeOptionalUrl(props.coverImageUrl, "Publication cover image URL"),
    });
  }

  public id(): PnpuUuid {
    return this.props.id;
  }

  public title(): string {
    return this.props.title;
  }

  public publisher(): Publisher {
    return this.props.publisher;
  }

  public contributors(): readonly Contributor[] {
    return [...this.props.contributors];
  }

  public identifiers(): readonly Identifier[] {
    return [...this.props.identifiers];
  }

  public subjects(): readonly Subject[] {
    return [...this.props.subjects];
  }

  public resources(): readonly Resource[] {
    return [...this.props.resources];
  }

  public snapshot(): PublicationProps {
    return {
      ...this.props,
      contributors: [...this.props.contributors],
      identifiers: [...this.props.identifiers],
      subjects: [...this.props.subjects],
      resources: [...this.props.resources],
      keywords: this.props.keywords === undefined ? undefined : [...this.props.keywords],
    };
  }
}

function requireNonEmptyArray<T>(values: readonly T[], fieldName: string): readonly T[] {
  if (values.length === 0) {
    throw new DomainValidationError(`${fieldName} are required.`);
  }

  return [...values];
}

function requirePublicationIdentifiers(
  identifiers: readonly Identifier[],
  type: PublicationType,
): readonly Identifier[] {
  const normalizedIdentifiers = requireNonEmptyArray(identifiers, "Publication identifiers");
  const requiresIsbn = ISBN_REQUIRED_PUBLICATION_TYPES.includes(
    type as (typeof ISBN_REQUIRED_PUBLICATION_TYPES)[number],
  );

  if (
    requiresIsbn &&
    normalizedIdentifiers.every(
      (identifier) => identifier.type() !== "isbn" && identifier.type() !== "eisbn",
    )
  ) {
    throw new DomainValidationError(`Publication type ${type} requires an ISBN identifier.`);
  }

  return normalizedIdentifiers;
}

function requireIsoDate(value: string): string {
  const normalizedValue = requireNonEmptyText(value, "Publication date");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    throw new DomainValidationError("Publication date must be an ISO 8601 date.");
  }

  const date = new Date(`${normalizedValue}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalizedValue) {
    throw new DomainValidationError("Publication date must be a valid calendar date.");
  }

  return normalizedValue;
}

function requireKeywords(keywords: readonly string[] | undefined): readonly string[] {
  if (keywords === undefined) {
    throw new DomainValidationError("Publication keywords are required.");
  }

  const normalizedKeywords = [
    ...new Set(keywords.map((keyword) => normalizeOptionalText(keyword))),
  ].filter((keyword): keyword is string => keyword !== undefined);

  if (normalizedKeywords.length === 0) {
    throw new DomainValidationError("Publication keywords are required.");
  }

  if (normalizedKeywords.length > 10) {
    throw new DomainValidationError("Publication keywords must not exceed 10 items.");
  }

  return normalizedKeywords;
}
