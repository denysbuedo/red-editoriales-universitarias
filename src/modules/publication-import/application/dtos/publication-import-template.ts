export interface PublicationImportTemplateDto {
  readonly content: string;
  readonly contentType: "text/csv; charset=utf-8";
  readonly fileName: string;
}
