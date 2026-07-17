import { Contributor, Identifier, Publication, Resource, Subject } from "../../domain";
import {
  ContributorSummary,
  IdentifierDto,
  PublicationDetail,
  PublicationSummary,
  ResourceDto,
  SubjectSummary,
} from "../dtos";
import { toPublisherSummary } from "./publisher-mapper";

export function toPublicationSummary(publication: Publication): PublicationSummary {
  const snapshot = publication.snapshot();

  return {
    id: snapshot.id.value(),
    title: snapshot.title,
    subtitle: snapshot.subtitle,
    publicationDate: snapshot.publicationDate,
    language: snapshot.language.value(),
    type: snapshot.type,
    license: snapshot.license,
    primaryIdentifier: selectPrimaryIdentifier(snapshot.identifiers),
    subjects: snapshot.subjects.map(toSubjectSummary),
    keywords: snapshot.keywords,
    publisher: toPublisherSummary(snapshot.publisher),
  };
}

export function toPublicationDetail(publication: Publication): PublicationDetail {
  const snapshot = publication.snapshot();

  return {
    ...toPublicationSummary(publication),
    subtitle: snapshot.subtitle,
    abstract: snapshot.abstract,
    format: snapshot.format,
    collection:
      snapshot.collection === undefined
        ? undefined
        : {
            id: snapshot.collection.id().value(),
            title: snapshot.collection.title(),
            collectionCode: snapshot.collection.snapshot().collectionCode,
            editorialSeries: snapshot.collection.snapshot().editorialSeries,
          },
    contributors: snapshot.contributors.map(toContributorSummary),
    identifiers: snapshot.identifiers.map(toIdentifierDto),
    resources: snapshot.resources.map(toResourceDto),
  };
}

function toContributorSummary(contributor: Contributor): ContributorSummary {
  const snapshot = contributor.snapshot();

  return {
    id: snapshot.id.value(),
    name: snapshot.name,
    roles: snapshot.roles,
    orcid: snapshot.orcid?.value(),
  };
}

function toIdentifierDto(identifier: Identifier): IdentifierDto {
  return identifier.snapshot();
}

function selectPrimaryIdentifier(identifiers: readonly Identifier[]): IdentifierDto | undefined {
  if (identifiers.length === 0) {
    return undefined;
  }

  const preferredIdentifier =
    identifiers.find((identifier) => identifier.type() === "isbn") ??
    identifiers.find((identifier) => identifier.type() === "doi") ??
    identifiers.find((identifier) => identifier.type() === "uri") ??
    identifiers[0];

  return toIdentifierDto(preferredIdentifier);
}

function toSubjectSummary(subject: Subject): SubjectSummary {
  const snapshot = subject.snapshot();

  return {
    identifier: snapshot.identifier,
    preferredLabel: snapshot.preferredLabel,
    uri: snapshot.uri,
  };
}

function toResourceDto(resource: Resource): ResourceDto {
  const snapshot = resource.snapshot();

  return {
    type: snapshot.type,
    url: snapshot.url,
    format: snapshot.format,
    fileSize: snapshot.fileSize,
    checksum: snapshot.checksum,
    language: snapshot.language?.value(),
    license: snapshot.license,
  };
}
