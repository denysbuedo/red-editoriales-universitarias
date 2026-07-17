import { Collection, PnpuUuid } from "../../domain";
import { PageRequest, PaginatedResult } from "../pagination";

export interface CollectionRepository {
  findById(id: PnpuUuid): Promise<Collection | null>;
  list(request: PageRequest): Promise<PaginatedResult<Collection>>;
}
