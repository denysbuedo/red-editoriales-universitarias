export interface PublicationImportSummaryDto {
  readonly rowCount: number;
  readonly rowsWithRequiredSpreadsheetFields: number;
  readonly missingFieldCount: number;
  readonly invalidIsbnCount: number;
  readonly duplicateIsbnCount: number;
  readonly invalidPublicationDateCount: number;
  readonly missingPnpuEnrichmentFields: readonly string[];
}

export interface PublicationImportIssueRowDto {
  readonly row: number;
  readonly isbn: string;
  readonly title: string;
}

export interface PublicationImportMissingRowDto extends PublicationImportIssueRowDto {
  readonly missingFields: readonly string[];
}

export interface PublicationImportDuplicateIsbnDto {
  readonly isbn: string;
  readonly count: number;
  readonly rows: readonly Pick<PublicationImportIssueRowDto, "row" | "title">[];
}

export interface PublicationImportDateFormatsDto {
  readonly empty: number;
  readonly yearOnly: number;
  readonly monthYear: number;
  readonly isoDate: number;
  readonly invalid: number;
  readonly invalidRows: readonly (PublicationImportIssueRowDto & { readonly date: string })[];
}

export interface PublicationImportDiagnosticsDto {
  readonly source: string;
  readonly sheet: string;
  readonly summary: PublicationImportSummaryDto;
  readonly missingByField: Readonly<Record<string, number>>;
  readonly missingRows: readonly PublicationImportMissingRowDto[];
  readonly invalidIsbnRows: readonly PublicationImportIssueRowDto[];
  readonly duplicateIsbns: readonly PublicationImportDuplicateIsbnDto[];
  readonly publicationDateFormats: PublicationImportDateFormatsDto;
  readonly distinctValues: Readonly<
    Record<string, readonly { readonly value: string; readonly count: number }[]>
  >;
  readonly mappingAssessment: {
    readonly canPublishDirectlyToPnpu: boolean;
    readonly reason: string;
    readonly recommendedNextStep: string;
  };
}
