import { PublicationImportAuditLogDto } from "../dtos";
import { PublicationImportAuditRepository } from "../ports/publication-import-audit-repository";
import { PublicationImportDiagnosisServiceOptions } from "./publication-import-diagnosis-service";

export class PublicationImportAuditService {
  public constructor(
    private readonly repository: PublicationImportAuditRepository,
    private readonly options: PublicationImportDiagnosisServiceOptions,
  ) {}

  public async list(): Promise<PublicationImportAuditLogDto> {
    const entries = await this.repository.list();

    return {
      generatedAt: (this.options.now?.() ?? new Date()).toISOString(),
      summary: {
        entries: entries.length,
        createdItems: entries.reduce((total, entry) => total + entry.summary.createdItems, 0),
        createdMedia: entries.reduce((total, entry) => total + entry.summary.createdMedia, 0),
      },
      entries,
    };
  }
}
