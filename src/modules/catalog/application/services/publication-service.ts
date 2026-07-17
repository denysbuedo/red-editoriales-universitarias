import { ApplicationError } from "../errors/application-error";
import { normalizePagination, PaginationInput, PaginatedResult } from "../pagination";
import { PublicationRepository } from "../ports";
import type { PublicationSort } from "../ports";
import { DomainValidationError, LanguageCode, PnpuUuid, Publication } from "../../domain";

export interface RecentPublicationsInput {
  readonly limit?: number;
}

export interface PublicationListInput extends PaginationInput {
  readonly q?: string;
  readonly publisherId?: string;
  readonly contributorId?: string;
  readonly collectionId?: string;
  readonly language?: string;
  readonly subject?: string;
  readonly sort?: string;
}

export class PublicationService {
  public constructor(private readonly publicationRepository: PublicationRepository) {}

  public async getPublication(id: string): Promise<Publication> {
    const publicationId = this.parsePublicationId(id);
    const publication = await this.publicationRepository.findById(publicationId);

    if (publication === null) {
      throw ApplicationError.notFound("Publication not found.");
    }

    return publication;
  }

  public async listPublications(
    input: PublicationListInput = {},
  ): Promise<PaginatedResult<Publication>> {
    const pagination = normalizePagination(input);

    return this.publicationRepository.list({
      ...pagination,
      q: normalizeSearchText(input.q, "Search query"),
      publisherId:
        input.publisherId === undefined ? undefined : this.parsePublicationId(input.publisherId),
      contributorId:
        input.contributorId === undefined
          ? undefined
          : this.parsePublicationId(input.contributorId),
      collectionId:
        input.collectionId === undefined ? undefined : this.parsePublicationId(input.collectionId),
      language: normalizeLanguage(input.language),
      subject: normalizeSearchText(input.subject, "Subject filter"),
      sort: normalizePublicationSort(input.sort),
    });
  }

  public async listRecentPublications(
    input: RecentPublicationsInput = {},
  ): Promise<readonly Publication[]> {
    const limit = input.limit ?? 10;

    if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
      throw ApplicationError.validation(
        "Recent publications limit must be an integer between 1 and 50.",
      );
    }

    return this.publicationRepository.listRecent({ limit });
  }

  private parsePublicationId(id: string): PnpuUuid {
    try {
      return PnpuUuid.create(id);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw ApplicationError.validation(error.message);
      }

      throw error;
    }
  }
}

const PUBLICATION_SORTS: readonly PublicationSort[] = [
  "publicationDateDesc",
  "publicationDateAsc",
  "titleAsc",
  "titleDesc",
  "publisherAsc",
];

function normalizePublicationSort(value: string | undefined): PublicationSort {
  if (value === undefined || value.trim().length === 0) {
    return "publicationDateDesc";
  }

  if (isPublicationSort(value)) {
    return value;
  }

  throw ApplicationError.validation("Publication sort is not supported.");
}

function isPublicationSort(value: string): value is PublicationSort {
  return PUBLICATION_SORTS.some((sort) => sort === value);
}

function normalizeSearchText(value: string | undefined, fieldName: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return undefined;
  }

  if (normalizedValue.length > 120) {
    throw ApplicationError.validation(`${fieldName} must not exceed 120 characters.`);
  }

  return normalizedValue;
}

function normalizeLanguage(value: string | undefined): string | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  try {
    return LanguageCode.create(value).value();
  } catch (error) {
    if (error instanceof DomainValidationError) {
      throw ApplicationError.validation(error.message);
    }

    throw error;
  }
}
