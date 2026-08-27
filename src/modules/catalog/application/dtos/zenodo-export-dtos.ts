export interface ZenodoMetadataExportWarningDto {
  readonly publicationId: string;
  readonly field: string;
  readonly message: string;
}

export interface ZenodoMetadataCreatorDto {
  readonly name: string;
  readonly affiliation?: string;
  readonly orcid?: string;
}

export interface ZenodoMetadataRelatedIdentifierDto {
  readonly identifier: string;
  readonly relation: "isIdenticalTo" | "isReferencedBy";
  readonly scheme: "doi" | "isbn" | "url";
}

export interface ZenodoMetadataFileDto {
  readonly url: string;
  readonly type: string;
  readonly format: string;
  readonly checksum?: string;
  readonly size?: number;
}

export interface ZenodoMetadataRecordDto {
  readonly pnpuId: string;
  readonly metadata: {
    readonly title: string;
    readonly upload_type: string;
    readonly publication_date: string;
    readonly description: string;
    readonly creators: readonly ZenodoMetadataCreatorDto[];
    readonly keywords: readonly string[];
    readonly language: string;
    readonly license?: string;
    readonly related_identifiers: readonly ZenodoMetadataRelatedIdentifierDto[];
  };
  readonly pnpu: {
    readonly publisherId: string;
    readonly publisherName: string;
    readonly publicationType: string;
    readonly subjects: readonly string[];
    readonly collection?: string;
  };
  readonly files: readonly ZenodoMetadataFileDto[];
}

export interface ZenodoMetadataExportPackageDto {
  readonly manifest: {
    readonly profile: "PNPU_ZENODO_METADATA_CANDIDATE_V1";
    readonly generatedAt: string;
    readonly totalPublications: number;
    readonly exportedPublications: number;
    readonly warningCount: number;
  };
  readonly records: readonly ZenodoMetadataRecordDto[];
  readonly warnings: readonly ZenodoMetadataExportWarningDto[];
}
