import { SubjectRepository } from "../../application";
import { PaginatedResult, PageRequest, paginateItems } from "../../application/pagination";
import { Subject } from "../../domain";

export class InMemorySubjectRepository implements SubjectRepository {
  public constructor(private readonly subjects: readonly Subject[]) {}

  public findByIdentifier(identifier: string): Promise<Subject | null> {
    return Promise.resolve(
      this.subjects.find((subject) => subject.identifier() === identifier) ?? null,
    );
  }

  public list(request: PageRequest): Promise<PaginatedResult<Subject>> {
    return Promise.resolve(paginateItems(this.subjects, request));
  }
}
