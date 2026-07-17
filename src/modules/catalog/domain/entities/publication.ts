import { DomainValidationError } from "../errors/domain-validation-error";
import { LanguageCode, PnpuUuid } from "../value-objects";
import { Collection } from "./collection";
import { Contributor } from "./contributor";
import { Identifier } from "./identifier";
import { normalizeOptionalText, requireDefined, requireNonEmptyText } from "./domain-guards";
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
      identifiers: requireNonEmptyArray(props.identifiers, "Publication identifiers"),
      subjects: requireNonEmptyArray(props.subjects, "Publication subjects"),
      resources: requireNonEmptyArray(props.resources, "Publication resources"),
      type: props.type,
      format: requireNonEmptyText(props.format, "Publication format"),
      subtitle: normalizeOptionalText(props.subtitle),
      abstract: normalizeOptionalText(props.abstract),
      keywords: normalizeKeywords(props.keywords),
      license: normalizeOptionalText(props.license),
      collection: props.collection,
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

function normalizeKeywords(keywords: readonly string[] | undefined): readonly string[] | undefined {
  if (keywords === undefined) {
    return undefined;
  }

  const normalizedKeywords = [
    ...new Set(keywords.map((keyword) => normalizeOptionalText(keyword))),
  ].filter((keyword): keyword is string => keyword !== undefined);

  if (normalizedKeywords.length > 10) {
    throw new DomainValidationError("Publication keywords must not exceed 10 items.");
  }

  return normalizedKeywords;
}
