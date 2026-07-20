export interface PublicationImportPublisherAuthorityDto {
  readonly id: string;
  readonly label: string;
  readonly acronym?: string;
  readonly country: string;
}

export interface PublicationImportContributorAuthorityDto {
  readonly id: string;
  readonly label: string;
  readonly roles: readonly string[];
  readonly affiliation?: string;
  readonly country?: string;
}

export interface PublicationImportSubjectAuthorityDto {
  readonly id: string;
  readonly label: string;
  readonly uri?: string;
}

export interface PublicationImportAuthoritiesDto {
  readonly generatedAt: string;
  readonly summary: {
    readonly publishers: number;
    readonly contributors: number;
    readonly subjects: number;
  };
  readonly publishers: readonly PublicationImportPublisherAuthorityDto[];
  readonly contributors: readonly PublicationImportContributorAuthorityDto[];
  readonly subjects: readonly PublicationImportSubjectAuthorityDto[];
}
