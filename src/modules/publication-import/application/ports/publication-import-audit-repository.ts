import { PublicationImportAuditEntryDto } from "../dtos";
import { PublicationImportRollbackDto } from "../dtos/publication-import-rollback";

export interface PublicationImportAuditRepository {
  append(entry: PublicationImportAuditEntryDto): Promise<void>;
  appendRollback(result: PublicationImportRollbackDto): Promise<void>;
  get(id: string): Promise<PublicationImportAuditEntryDto | null>;
  list(): Promise<readonly PublicationImportAuditEntryDto[]>;
}
