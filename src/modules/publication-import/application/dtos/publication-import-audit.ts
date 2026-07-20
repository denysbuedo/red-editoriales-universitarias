import { PublicationImportCommitCreatedResourceDto } from "./publication-import-commit";

export interface PublicationImportAuditEntryDto {
  readonly id: string;
  readonly committedAt: string;
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

export interface PublicationImportAuditLogDto {
  readonly generatedAt: string;
  readonly summary: {
    readonly entries: number;
    readonly createdItems: number;
    readonly createdMedia: number;
  };
  readonly entries: readonly PublicationImportAuditEntryDto[];
}
