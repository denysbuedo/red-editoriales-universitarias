import { Collection, DomainValidationError, PnpuUuid, Publication } from "../../domain";
import { ApplicationError } from "../errors/application-error";
import { normalizePagination, PaginatedResult, PaginationInput } from "../pagination";
import { CollectionRepository, PublicationRepository } from "../ports";

export interface CollectionProfile {
  readonly collection: Collection;
  readonly publications: readonly Publication[];
}

export class CollectionService {
  public constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly publicationRepository: PublicationRepository,
  ) {}

  public async getCollection(id: string): Promise<CollectionProfile> {
    const collectionId = this.parseCollectionId(id);
    const collection = await this.collectionRepository.findById(collectionId);

    if (collection === null) {
      throw ApplicationError.notFound("Collection not found.");
    }

    const publications = await this.publicationRepository.list({
      page: 1,
      pageSize: 100,
      collectionId,
    });

    return { collection, publications: publications.data };
  }

  public async listCollections(
    input: PaginationInput = {},
  ): Promise<PaginatedResult<CollectionProfile>> {
    const collections = await this.collectionRepository.list(normalizePagination(input));
    const profiles = await Promise.all(
      collections.data.map(async (collection) => {
        const publications = await this.publicationRepository.list({
          page: 1,
          pageSize: 100,
          collectionId: collection.id(),
        });

        return { collection, publications: publications.data };
      }),
    );

    return { data: profiles, pagination: collections.pagination };
  }

  private parseCollectionId(id: string): PnpuUuid {
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
