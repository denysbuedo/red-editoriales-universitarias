export interface PublicationImportRetentionFileDto {
  readonly expired: boolean;
  readonly modifiedAt: string;
  readonly relativePath: string;
  readonly size: number;
}

export interface PublicationImportRetentionPlanDto {
  readonly generatedAt: string;
  readonly retentionDays: number;
  readonly cutoff: string | null;
  readonly summary: {
    readonly files: number;
    readonly expiredFiles: number;
    readonly bytes: number;
    readonly expiredBytes: number;
  };
  readonly files: readonly PublicationImportRetentionFileDto[];
}
