import { Publisher, PnpuUuid } from "../../domain";
import { PageRequest, PaginatedResult } from "../pagination";

export interface PublisherRepository {
  findById(id: PnpuUuid): Promise<Publisher | null>;
  list(request: PageRequest): Promise<PaginatedResult<Publisher>>;
}
