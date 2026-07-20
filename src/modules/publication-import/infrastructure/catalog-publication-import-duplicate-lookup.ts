import {
  PublicationImportDuplicateIdentifier,
  PublicationImportDuplicateLookup,
  PublicationImportDuplicateMatch,
} from "../application/ports/publication-import-duplicate-lookup";

import { PublicationRepository } from "@/modules/catalog/application";
import { Publication } from "@/modules/catalog/domain";

const PAGE_SIZE = 100;
const MAX_PAGES = 100;

export class CatalogPublicationImportDuplicateLookup implements PublicationImportDuplicateLookup {
  public constructor(private readonly publicationRepository: PublicationRepository) {}

  public async findMatches(
    identifiers: readonly PublicationImportDuplicateIdentifier[],
  ): Promise<readonly PublicationImportDuplicateMatch[]> {
    if (identifiers.length === 0) {
      return [];
    }

    const requestedIdentifiers = new Set(
      identifiers.map((identifier) => buildIdentifierKey(identifier.type, identifier.value)),
    );
    const matches: PublicationImportDuplicateMatch[] = [];

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const result = await this.publicationRepository.list({ page, pageSize: PAGE_SIZE });

      for (const publication of result.data) {
        matches.push(...findPublicationMatches(publication, requestedIdentifiers));
      }

      if (page >= result.pagination.totalPages) {
        return distinctMatches(matches);
      }
    }

    return distinctMatches(matches);
  }
}

function findPublicationMatches(
  publication: Publication,
  requestedIdentifiers: ReadonlySet<string>,
): readonly PublicationImportDuplicateMatch[] {
  const publicationSnapshot = publication.snapshot();

  return publicationSnapshot.identifiers
    .map((identifier) => identifier.snapshot())
    .filter(
      (
        identifier,
      ): identifier is {
        readonly type: "doi" | "isbn";
        readonly value: string;
      } => identifier.type === "isbn" || identifier.type === "doi",
    )
    .filter((identifier) =>
      requestedIdentifiers.has(buildIdentifierKey(identifier.type, identifier.value)),
    )
    .map((identifier) => ({
      identifierType: identifier.type,
      identifierValue: identifier.value,
      publicationId: publicationSnapshot.id.value(),
      title: publicationSnapshot.title,
    }));
}

function distinctMatches(
  matches: readonly PublicationImportDuplicateMatch[],
): readonly PublicationImportDuplicateMatch[] {
  const matchByKey = new Map(
    matches.map((match) => [
      [match.identifierType, match.identifierValue, match.publicationId, match.title].join("|"),
      match,
    ]),
  );

  return [...matchByKey.values()];
}

function buildIdentifierKey(type: string, value: string): string {
  return `${type}:${value.trim().toLowerCase()}`;
}
