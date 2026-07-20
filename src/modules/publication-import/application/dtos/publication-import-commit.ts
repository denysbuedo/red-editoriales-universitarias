export interface PublicationImportCommitCreatedResourceDto {
  readonly row: number;
  readonly pnpuUuid: string;
  readonly omekaItemId: number;
  readonly omekaMediaId?: number;
}

export interface PublicationImportCommitDto {
  readonly generatedAt: string;
  readonly source: string;
  readonly sheet: string;
  readonly status: "committed";
  readonly summary: {
    readonly candidates: number;
    readonly createdItems: number;
    readonly createdMedia: number;
  };
  readonly created: readonly PublicationImportCommitCreatedResourceDto[];
}
