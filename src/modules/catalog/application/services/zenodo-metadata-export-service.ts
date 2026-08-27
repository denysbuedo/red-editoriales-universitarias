import {
  PublicationDetail,
  ZenodoMetadataCreatorDto,
  ZenodoMetadataExportPackageDto,
  ZenodoMetadataExportWarningDto,
  ZenodoMetadataFileDto,
  ZenodoMetadataRecordDto,
  ZenodoMetadataRelatedIdentifierDto,
} from "../dtos";

export interface ZenodoMetadataExportInput {
  readonly publications: readonly PublicationDetail[];
  readonly generatedAt?: Date;
}

export class ZenodoMetadataExportService {
  public buildPackage(input: ZenodoMetadataExportInput): ZenodoMetadataExportPackageDto {
    const generatedAt = input.generatedAt ?? new Date();
    const warnings: ZenodoMetadataExportWarningDto[] = [];
    const records = input.publications.map((publication) => this.toRecord(publication, warnings));

    return {
      manifest: {
        profile: "PNPU_ZENODO_METADATA_CANDIDATE_V1",
        generatedAt: generatedAt.toISOString(),
        totalPublications: input.publications.length,
        exportedPublications: records.length,
        warningCount: warnings.length,
      },
      records,
      warnings,
    };
  }

  private toRecord(
    publication: PublicationDetail,
    warnings: ZenodoMetadataExportWarningDto[],
  ): ZenodoMetadataRecordDto {
    const creators = publication.contributors
      .filter((contributor) => contributor.roles.includes("author"))
      .map<ZenodoMetadataCreatorDto>((contributor) => ({
        name: contributor.name,
        orcid: contributor.orcid,
      }));

    if (creators.length === 0) {
      warnings.push({
        publicationId: publication.id,
        field: "creators",
        message: "La publicacion no tiene contribuyentes con rol author para Zenodo.",
      });
    }

    if (publication.resources.length === 0) {
      warnings.push({
        publicationId: publication.id,
        field: "files",
        message: "La publicacion no tiene recursos digitales para adjuntar o referenciar.",
      });
    }

    if (publication.identifiers.every((identifier) => identifier.type !== "doi")) {
      warnings.push({
        publicationId: publication.id,
        field: "doi",
        message: "La publicacion no tiene DOI PNPU/Zenodo registrado.",
      });
    }

    return {
      pnpuId: publication.id,
      metadata: {
        title: publication.title,
        upload_type: mapPublicationTypeToZenodoUploadType(publication.type),
        publication_date: publication.publicationDate,
        description: publication.abstract ?? publication.subtitle ?? publication.title,
        creators:
          creators.length > 0
            ? creators
            : [{ name: publication.contributors[0]?.name ?? publication.publisher.officialName }],
        keywords: [
          ...(publication.keywords ?? []),
          ...publication.subjects.map((subject) => subject.preferredLabel),
        ],
        language: publication.language,
        license: normalizeLicense(publication.license),
        related_identifiers: publication.identifiers.flatMap(toRelatedIdentifier),
      },
      pnpu: {
        publisherId: publication.publisher.id,
        publisherName: publication.publisher.officialName,
        publicationType: publication.type,
        subjects: publication.subjects.map((subject) => subject.preferredLabel),
        collection: publication.collection?.title,
      },
      files: publication.resources.map(toFile),
    };
  }
}

function mapPublicationTypeToZenodoUploadType(type: string): string {
  if (type === "dataset") {
    return "dataset";
  }

  if (type === "video") {
    return "video";
  }

  return "publication";
}

function normalizeLicense(license: string | undefined): string | undefined {
  if (license === undefined) {
    return undefined;
  }

  const normalizedLicense = license.trim().toLowerCase();

  if (normalizedLicense === "cc by" || normalizedLicense === "cc-by") {
    return "cc-by-4.0";
  }

  if (normalizedLicense === "cc by-sa" || normalizedLicense === "cc-by-sa") {
    return "cc-by-sa-4.0";
  }

  if (normalizedLicense === "cc by-nc" || normalizedLicense === "cc-by-nc") {
    return "cc-by-nc-4.0";
  }

  return license;
}

function toRelatedIdentifier(identifier: {
  readonly type: string;
  readonly value: string;
}): readonly ZenodoMetadataRelatedIdentifierDto[] {
  if (identifier.type === "doi") {
    return [{ identifier: identifier.value, relation: "isIdenticalTo", scheme: "doi" }];
  }

  if (identifier.type === "isbn") {
    return [{ identifier: identifier.value, relation: "isReferencedBy", scheme: "isbn" }];
  }

  if (identifier.type === "uri") {
    return [{ identifier: identifier.value, relation: "isReferencedBy", scheme: "url" }];
  }

  return [];
}

function toFile(resource: {
  readonly checksum?: string;
  readonly fileSize?: number;
  readonly format: string;
  readonly type: string;
  readonly url: string;
}): ZenodoMetadataFileDto {
  return {
    url: resource.url,
    type: resource.type,
    format: resource.format,
    checksum: resource.checksum,
    size: resource.fileSize,
  };
}
