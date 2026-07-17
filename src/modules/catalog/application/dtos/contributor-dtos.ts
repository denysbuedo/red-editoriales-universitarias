import { PublicationSummary } from "./publication-dtos";

export interface ContributorAuthoritySummary {
  readonly id: string;
  readonly name: string;
  readonly roles: readonly string[];
  readonly givenName?: string;
  readonly familyName?: string;
  readonly orcid?: string;
  readonly affiliation?: string;
  readonly country?: string;
  readonly publicationCount: number;
}

export interface ContributorDetail extends ContributorAuthoritySummary {
  readonly biography?: string;
  readonly publications: readonly PublicationSummary[];
}
