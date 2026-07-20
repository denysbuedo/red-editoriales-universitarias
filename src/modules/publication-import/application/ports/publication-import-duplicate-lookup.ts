export type PublicationImportDuplicateIdentifierType = "doi" | "isbn";

export interface PublicationImportDuplicateIdentifier {
  readonly type: PublicationImportDuplicateIdentifierType;
  readonly value: string;
}

export interface PublicationImportDuplicateMatch {
  readonly identifierType: PublicationImportDuplicateIdentifierType;
  readonly identifierValue: string;
  readonly publicationId: string;
  readonly title: string;
}

export interface PublicationImportDuplicateLookup {
  findMatches(
    identifiers: readonly PublicationImportDuplicateIdentifier[],
  ): Promise<readonly PublicationImportDuplicateMatch[]>;
}
