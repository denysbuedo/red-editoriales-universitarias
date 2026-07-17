import { Contributor, Publication } from "../../domain";
import { ContributorAuthoritySummary, ContributorDetail } from "../dtos";
import { toPublicationSummary } from "./publication-mapper";

export function toContributorAuthoritySummary(
  contributor: Contributor,
  publicationCount: number,
): ContributorAuthoritySummary {
  const snapshot = contributor.snapshot();

  return {
    id: snapshot.id.value(),
    name: snapshot.name,
    roles: snapshot.roles,
    givenName: snapshot.givenName,
    familyName: snapshot.familyName,
    orcid: snapshot.orcid?.value(),
    affiliation: snapshot.affiliation,
    country: snapshot.country,
    publicationCount,
  };
}

export function toContributorDetail(
  contributor: Contributor,
  publications: readonly Publication[],
): ContributorDetail {
  const snapshot = contributor.snapshot();

  return {
    ...toContributorAuthoritySummary(contributor, publications.length),
    biography: snapshot.biography,
    publications: publications.map(toPublicationSummary),
  };
}
