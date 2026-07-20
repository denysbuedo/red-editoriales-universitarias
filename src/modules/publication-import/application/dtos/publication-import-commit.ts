export interface PublicationImportCommitCreatedResourceDto {
  readonly row: number;
  readonly pnpuUuid: string;
  readonly omekaItemId: number;
  readonly omekaItemModified?: string;
  readonly omekaMediaId?: number;
  readonly omekaMediaModified?: string;
}

export interface PublicationImportCommitDto {
  readonly auditId: string;
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
