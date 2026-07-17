import { ContributorRepository } from "../../application";
import { PaginatedResult, PageRequest, paginateItems } from "../../application/pagination";
import { Contributor, PnpuUuid } from "../../domain";

export class InMemoryContributorRepository implements ContributorRepository {
  public constructor(private readonly contributors: readonly Contributor[]) {}

  public findById(id: PnpuUuid): Promise<Contributor | null> {
    return Promise.resolve(
      this.contributors.find((contributor) => contributor.id().equals(id)) ?? null,
    );
  }

  public list(request: PageRequest): Promise<PaginatedResult<Contributor>> {
    return Promise.resolve(paginateItems(this.contributors, request));
  }
}
