import { PublicationImportDiagnosticsDto } from "./publication-import-diagnostics";

export type PublicationImportMappingDecisionDto = "mappable" | "needs_enrichment" | "rejected";

export interface PublicationImportMappingPreviewRowDto {
  readonly row: number;
  readonly title: string;
  readonly isbn: string;
  readonly normalizedIsbn: string;
  readonly primaryContributor: string;
  readonly publisher: string;
  readonly genreOrPublicationType: string;
  readonly formats: readonly string[];
  readonly publicationDate: string;
  readonly normalizedPublicationDate: string | null;
  readonly decision: PublicationImportMappingDecisionDto;
  readonly reasons: readonly string[];
  readonly missingPnpuFields: readonly string[];
}

export interface PublicationImportMappingPreviewDto {
  readonly source: string;
  readonly sheet: string;
  readonly generatedAt: string;
  readonly summary: {
    readonly totalRows: number;
    readonly mappable: number;
    readonly needsEnrichment: number;
    readonly rejected: number;
  };
  readonly unresolvedPublishers: readonly string[];
  readonly unresolvedGenresOrPublicationTypes: readonly string[];
  readonly formatsWithoutDigitalResource: readonly string[];
  readonly rows: readonly PublicationImportMappingPreviewRowDto[];
  readonly diagnostics: PublicationImportDiagnosticsDto;
}
