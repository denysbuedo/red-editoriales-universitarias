import { PublicationImportAuditEntryDto } from "../dtos";

export interface PublicationImportAuditRepository {
  append(entry: PublicationImportAuditEntryDto): Promise<void>;
  list(): Promise<readonly PublicationImportAuditEntryDto[]>;
}
