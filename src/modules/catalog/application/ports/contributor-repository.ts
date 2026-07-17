import { Contributor, PnpuUuid } from "../../domain";
import { PageRequest, PaginatedResult } from "../pagination";

export interface ContributorRepository {
  findById(id: PnpuUuid): Promise<Contributor | null>;
  list(request: PageRequest): Promise<PaginatedResult<Contributor>>;
}
