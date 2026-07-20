import { PublicationImportCommitCreatedResourceDto } from "../dtos";

export interface PublicationImportRollbackVerifiedResource {
  readonly row: number;
  readonly pnpuUuid: string;
  readonly omekaItemId: number;
  readonly currentItemModified?: string;
  readonly currentPnpuUuid?: string;
  readonly itemExists: boolean;
  readonly mediaExists: boolean;
  readonly omekaMediaId?: number;
  readonly currentMediaModified?: string;
}

export interface PublicationImportRollbackVerifier {
  verify(
    resources: readonly PublicationImportCommitCreatedResourceDto[],
  ): Promise<readonly PublicationImportRollbackVerifiedResource[]>;
}
