import { PublicationImportTemplateDto } from "../dtos";

const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";

const PUBLICATION_BASE_COLUMNS = [
  "isbn",
  "title",
  "primaryContributor",
  "publisher",
  "genreOrPublicationType",
  "format",
  "publicationDate",
] as const;

const PUBLICATION_ENRICHMENT_COLUMNS = [
  "row",
  "pnpuUuid",
  "title",
  "isbn",
  "doi",
  "publicationDate",
  "publisher",
  "primaryContributor",
  "contributorAuthorityIds",
  "publisherAuthorityId",
  "genreOrPublicationType",
  "controlledTypeOrGenre",
  "formats",
  "digitalResourceUrl",
  "language",
  "subjects",
  "license",
  "notes",
] as const;

export class PublicationImportTemplateService {
  public buildBasePublicationTemplate(): PublicationImportTemplateDto {
    return {
      content: buildCsv([
        [...PUBLICATION_BASE_COLUMNS],
        [
          "9789590000003",
          "Título de ejemplo",
          "Nombre Apellidos",
          "Editorial Universitaria",
          "Libro",
          "pdf",
          "2026-07-19",
        ],
      ]),
      contentType: CSV_CONTENT_TYPE,
      fileName: "pnpu-plantilla-publicaciones-base.csv",
    };
  }

  public buildEnrichmentTemplate(): PublicationImportTemplateDto {
    return {
      content: buildCsv([
        [...PUBLICATION_ENRICHMENT_COLUMNS],
        [
          "2",
          "01990f5a-0000-7000-8000-000000000901",
          "Título de ejemplo",
          "9789590000003",
          "",
          "2026-07-19",
          "Editorial Universitaria",
          "Nombre Apellidos",
          "01990f5a-0000-7000-8000-000000000201",
          "01990f5a-0000-7000-8000-000000000203",
          "Libro",
          "book",
          "pdf",
          "https://editorial.example.edu/libro.pdf",
          "es",
          "37.01",
          "CC BY",
          "Ejemplo; sustituir por datos reales.",
        ],
      ]),
      contentType: CSV_CONTENT_TYPE,
      fileName: "pnpu-plantilla-enriquecimiento.csv",
    };
  }
}

function buildCsv(rows: readonly (readonly string[])[]): string {
  return `\uFEFF${rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")}\r\n`;
}

function escapeCsvCell(value: string): string {
  if (!/[",\r\n]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/"/gu, '""')}"`;
}
