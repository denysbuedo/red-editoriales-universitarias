import { PublisherSummary } from "./publisher-dtos";

export interface ContributorSummary {
  readonly id: string;
  readonly name: string;
  readonly roles: readonly string[];
  readonly orcid?: string;
}

export interface SubjectSummary {
  readonly identifier: string;
  readonly preferredLabel: string;
  readonly uri?: string;
}

export interface IdentifierDto {
  readonly type: string;
  readonly value: string;
}

export interface ResourceDto {
  readonly type: string;
  readonly url: string;
  readonly format: string;
  readonly fileSize?: number;
  readonly checksum?: string;
  readonly language?: string;
  readonly license?: string;
}

export interface PublicationSummary {
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly publicationDate: string;
  readonly language: string;
  readonly type: string;
  readonly license?: string;
  readonly primaryIdentifier?: IdentifierDto;
  readonly subjects: readonly SubjectSummary[];
  readonly keywords?: readonly string[];
  readonly publisher: PublisherSummary;
}

export interface PublicationDetail extends PublicationSummary {
  readonly abstract?: string;
  readonly format: string;
  readonly collection?: {
    readonly id: string;
    readonly title: string;
    readonly collectionCode?: string;
    readonly editorialSeries?: string;
  };
  readonly contributors: readonly ContributorSummary[];
  readonly identifiers: readonly IdentifierDto[];
  readonly resources: readonly ResourceDto[];
}
