import { Subject } from "../../domain";
import { PageRequest, PaginatedResult } from "../pagination";

export interface SubjectRepository {
  findByIdentifier(identifier: string): Promise<Subject | null>;
  list(request: PageRequest): Promise<PaginatedResult<Subject>>;
}
