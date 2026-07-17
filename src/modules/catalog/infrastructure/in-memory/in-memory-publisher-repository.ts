import { PublisherRepository } from "../../application";
import { PageRequest, PaginatedResult, paginateItems } from "../../application/pagination";
import { PnpuUuid, Publisher } from "../../domain";

export class InMemoryPublisherRepository implements PublisherRepository {
  public constructor(private readonly publishers: readonly Publisher[]) {}

  public findById(id: PnpuUuid): Promise<Publisher | null> {
    return Promise.resolve(this.publishers.find((publisher) => publisher.id().equals(id)) ?? null);
  }

  public list(request: PageRequest): Promise<PaginatedResult<Publisher>> {
    return Promise.resolve(paginateItems(this.publishers, request));
  }
}
