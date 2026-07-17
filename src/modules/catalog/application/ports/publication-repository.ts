import { Publication, PnpuUuid } from "../../domain";
import { PageRequest, PaginatedResult } from "../pagination";

export interface RecentPublicationsRequest {
  readonly limit: number;
}

export type PublicationSort =
  "publicationDateDesc" | "publicationDateAsc" | "titleAsc" | "titleDesc" | "publisherAsc";

export interface PublicationListQuery extends PageRequest {
  readonly q?: string;
  readonly publisherId?: PnpuUuid;
  readonly contributorId?: PnpuUuid;
  readonly collectionId?: PnpuUuid;
  readonly language?: string;
  readonly subject?: string;
  readonly sort?: PublicationSort;
}

export interface PublicationRepository {
  findById(id: PnpuUuid): Promise<Publication | null>;
  list(request: PublicationListQuery): Promise<PaginatedResult<Publication>>;
  listRecent(request: RecentPublicationsRequest): Promise<readonly Publication[]>;
}
