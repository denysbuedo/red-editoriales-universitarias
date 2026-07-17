import { Collection, Publication, Subject } from "../../domain";
import { CollectionDetail, CollectionSummary, SubjectSummary } from "../dtos";
import { toPublicationSummary } from "./publication-mapper";
import { toPublisherSummary } from "./publisher-mapper";

export function toCollectionSummary(
  collection: Collection,
  publicationCount: number,
): CollectionSummary {
  const snapshot = collection.snapshot();

  return {
    id: snapshot.id.value(),
    title: snapshot.title,
    publisher: toPublisherSummary(snapshot.publisher),
    description: snapshot.description,
    collectionCode: snapshot.collectionCode,
    editorialSeries: snapshot.editorialSeries,
    subjects: snapshot.subjects?.map(toSubjectSummary),
    publicationCount,
  };
}

export function toCollectionDetail(
  collection: Collection,
  publications: readonly Publication[],
): CollectionDetail {
  return {
    ...toCollectionSummary(collection, publications.length),
    publications: publications.map(toPublicationSummary),
  };
}

function toSubjectSummary(subject: Subject): SubjectSummary {
  const snapshot = subject.snapshot();

  return {
    identifier: snapshot.identifier,
    preferredLabel: snapshot.preferredLabel,
    uri: snapshot.uri,
  };
}
