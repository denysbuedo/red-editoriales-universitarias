export interface PublicationImportRollbackDeletedResourceDto {
  readonly type: "item" | "media";
  readonly omekaId: number;
  readonly pnpuUuid: string;
}

export interface PublicationImportRollbackDto {
  readonly rollbackId: string;
  readonly auditId: string;
  readonly rolledBackAt: string;
  readonly status: "rolled_back";
  readonly summary: {
    readonly deletedItems: number;
    readonly deletedMedia: number;
  };
  readonly deleted: readonly PublicationImportRollbackDeletedResourceDto[];
}
