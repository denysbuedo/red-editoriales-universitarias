import { PublicationImportMappingPreviewDto } from "./publication-import-mapping-preview";

export type PublicationImportDryRunDecisionDto = "ready" | "incomplete" | "rejected";

export interface PublicationImportDryRunCandidateDto {
  readonly row: number;
  readonly title: string;
  readonly isbn: string;
  readonly doi?: string;
  readonly publisher: string;
  readonly publicationDate: string;
  readonly contributorAuthorityIds: readonly string[];
  readonly publisherAuthorityId: string;
  readonly typeOrGenre: string;
  readonly formats: readonly string[];
  readonly digitalResourceUrl: string;
  readonly language: string;
  readonly subjects: readonly string[];
  readonly license: string;
  readonly decision: PublicationImportDryRunDecisionDto;
  readonly reasons: readonly string[];
}

export interface PublicationImportDryRunDto {
  readonly source: string;
  readonly sheet: string;
  readonly generatedAt: string;
  readonly summary: {
    readonly totalRows: number;
    readonly ready: number;
    readonly incomplete: number;
    readonly rejected: number;
    readonly enrichmentRows: number;
  };
  readonly candidates: readonly PublicationImportDryRunCandidateDto[];
  readonly preview: PublicationImportMappingPreviewDto;
}
