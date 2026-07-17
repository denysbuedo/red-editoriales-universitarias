import {
  PublicationListQuery,
  PublicationRepository,
  RecentPublicationsRequest,
} from "../../application";
import { PaginatedResult, paginateItems } from "../../application/pagination";
import { PnpuUuid, Publication } from "../../domain";

export class InMemoryPublicationRepository implements PublicationRepository {
  public constructor(private readonly publications: readonly Publication[]) {}

  public findById(id: PnpuUuid): Promise<Publication | null> {
    return Promise.resolve(
      this.publications.find((publication) => publication.id().equals(id)) ?? null,
    );
  }

  public list(request: PublicationListQuery): Promise<PaginatedResult<Publication>> {
    const publications = this.publications.filter(matchesQuery(request)).sort(compareBy(request));

    return Promise.resolve(paginateItems(publications, request));
  }

  public listRecent(request: RecentPublicationsRequest): Promise<readonly Publication[]> {
    return Promise.resolve(this.publications.slice(0, request.limit));
  }
}

function compareBy(query: PublicationListQuery): (left: Publication, right: Publication) => number {
  return (left, right) => {
    const leftSnapshot = left.snapshot();
    const rightSnapshot = right.snapshot();

    switch (query.sort ?? "publicationDateDesc") {
      case "publicationDateAsc":
        return compareText(leftSnapshot.publicationDate, rightSnapshot.publicationDate);
      case "titleAsc":
        return compareText(leftSnapshot.title, rightSnapshot.title);
      case "titleDesc":
        return compareText(rightSnapshot.title, leftSnapshot.title);
      case "publisherAsc":
        return compareText(
          leftSnapshot.publisher.officialName(),
          rightSnapshot.publisher.officialName(),
        );
      case "publicationDateDesc":
        return compareText(rightSnapshot.publicationDate, leftSnapshot.publicationDate);
    }
  };
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, "es");
}

function matchesQuery(query: PublicationListQuery): (publication: Publication) => boolean {
  return (publication) => {
    const snapshot = publication.snapshot();

    if (query.publisherId !== undefined && !snapshot.publisher.id().equals(query.publisherId)) {
      return false;
    }

    if (query.contributorId !== undefined) {
      const contributorId = query.contributorId;

      if (!snapshot.contributors.some((contributor) => contributor.id().equals(contributorId))) {
        return false;
      }
    }

    if (query.collectionId !== undefined) {
      const collectionId = query.collectionId;

      if (snapshot.collection?.id().equals(collectionId) !== true) {
        return false;
      }
    }

    if (query.language !== undefined && snapshot.language.value() !== query.language) {
      return false;
    }

    if (query.subject !== undefined && !matchesSubject(snapshot.subjects, query.subject)) {
      return false;
    }

    if (query.q !== undefined && !matchesSearchText(publication, query.q)) {
      return false;
    }

    return true;
  };
}

function matchesSubject(
  subjects: ReturnType<Publication["snapshot"]>["subjects"],
  subject: string,
): boolean {
  const normalizedSubject = normalizeForSearch(subject);

  return subjects.some((item) => {
    const snapshot = item.snapshot();

    return (
      normalizeForSearch(snapshot.identifier).includes(normalizedSubject) ||
      normalizeForSearch(snapshot.preferredLabel).includes(normalizedSubject)
    );
  });
}

function matchesSearchText(publication: Publication, query: string): boolean {
  const snapshot = publication.snapshot();
  const haystack = [
    snapshot.title,
    snapshot.subtitle,
    snapshot.abstract,
    snapshot.publisher.officialName(),
    snapshot.publisher.snapshot().acronym,
    ...snapshot.identifiers.map((identifier) => identifier.snapshot().value),
    ...snapshot.subjects.flatMap((subject) => {
      const subjectSnapshot = subject.snapshot();

      return [subjectSnapshot.identifier, subjectSnapshot.preferredLabel];
    }),
    ...(snapshot.keywords ?? []),
  ]
    .filter((value): value is string => value !== undefined)
    .map(normalizeForSearch)
    .join(" ");

  return haystack.includes(normalizeForSearch(query));
}

function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
