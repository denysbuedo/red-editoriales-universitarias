import { PublicationSummary } from "./publication-dtos";

export interface SubjectAuthoritySummary {
  readonly identifier: string;
  readonly preferredLabel: string;
  readonly uri?: string;
  readonly broader?: string;
  readonly related?: readonly string[];
  readonly publicationCount: number;
}

export interface SubjectDetail extends SubjectAuthoritySummary {
  readonly publications: readonly PublicationSummary[];
}
