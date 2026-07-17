import { Publication, Subject } from "../../domain";
import { SubjectAuthoritySummary, SubjectDetail } from "../dtos";
import { toPublicationSummary } from "./publication-mapper";

export function toSubjectAuthoritySummary(
  subject: Subject,
  publicationCount: number,
): SubjectAuthoritySummary {
  const snapshot = subject.snapshot();

  return {
    identifier: snapshot.identifier,
    preferredLabel: snapshot.preferredLabel,
    uri: snapshot.uri,
    broader: snapshot.broader,
    related: snapshot.related,
    publicationCount,
  };
}

export function toSubjectDetail(
  subject: Subject,
  publications: readonly Publication[],
): SubjectDetail {
  return {
    ...toSubjectAuthoritySummary(subject, publications.length),
    publications: publications.map(toPublicationSummary),
  };
}
