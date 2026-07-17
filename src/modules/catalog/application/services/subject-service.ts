import { Publication, Subject } from "../../domain";
import { ApplicationError } from "../errors/application-error";
import { normalizePagination, PaginatedResult, PaginationInput } from "../pagination";
import { PublicationRepository, SubjectRepository } from "../ports";

export interface SubjectProfile {
  readonly subject: Subject;
  readonly publications: readonly Publication[];
}

export class SubjectService {
  public constructor(
    private readonly subjectRepository: SubjectRepository,
    private readonly publicationRepository: PublicationRepository,
  ) {}

  public async getSubject(identifier: string): Promise<SubjectProfile> {
    const subjectIdentifier = normalizeSubjectIdentifier(identifier);
    const subject = await this.subjectRepository.findByIdentifier(subjectIdentifier);

    if (subject === null) {
      throw ApplicationError.notFound("Subject not found.");
    }

    const publications = await this.publicationRepository.list({
      page: 1,
      pageSize: 100,
      subject: subjectIdentifier,
    });

    return {
      subject,
      publications: publications.data,
    };
  }

  public async listSubjects(input: PaginationInput = {}): Promise<PaginatedResult<SubjectProfile>> {
    const subjects = await this.subjectRepository.list(normalizePagination(input));
    const profiles = await Promise.all(
      subjects.data.map(async (subject) => {
        const publications = await this.publicationRepository.list({
          page: 1,
          pageSize: 100,
          subject: subject.identifier(),
        });

        return {
          subject,
          publications: publications.data,
        };
      }),
    );

    return {
      data: profiles,
      pagination: subjects.pagination,
    };
  }
}

function normalizeSubjectIdentifier(identifier: string): string {
  const normalizedIdentifier = identifier.trim();

  if (normalizedIdentifier.length === 0) {
    throw ApplicationError.validation("Subject identifier is required.");
  }

  if (normalizedIdentifier.length > 120) {
    throw ApplicationError.validation("Subject identifier must not exceed 120 characters.");
  }

  return normalizedIdentifier;
}
