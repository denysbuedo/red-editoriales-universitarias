import { PublicationImportAuditEntryDto } from "../dtos";

export interface PublicationImportAuditRepository {
  append(entry: PublicationImportAuditEntryDto): Promise<void>;
  get(id: string): Promise<PublicationImportAuditEntryDto | null>;
  list(): Promise<readonly PublicationImportAuditEntryDto[]>;
}
