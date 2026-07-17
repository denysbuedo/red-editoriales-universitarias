import { CollectionRepository } from "../../application";
import { PaginatedResult, PageRequest, paginateItems } from "../../application/pagination";
import { Collection, PnpuUuid } from "../../domain";

export class InMemoryCollectionRepository implements CollectionRepository {
  public constructor(private readonly collections: readonly Collection[]) {}

  public findById(id: PnpuUuid): Promise<Collection | null> {
    return Promise.resolve(
      this.collections.find((collection) => collection.id().equals(id)) ?? null,
    );
  }

  public list(request: PageRequest): Promise<PaginatedResult<Collection>> {
    return Promise.resolve(paginateItems(this.collections, request));
  }
}
