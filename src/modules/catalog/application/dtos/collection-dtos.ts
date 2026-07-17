import { PublicationSummary } from "./publication-dtos";
import { PublisherSummary } from "./publisher-dtos";
import { SubjectSummary } from "./publication-dtos";

export interface CollectionSummary {
  readonly id: string;
  readonly title: string;
  readonly publisher: PublisherSummary;
  readonly description?: string;
  readonly collectionCode?: string;
  readonly editorialSeries?: string;
  readonly subjects?: readonly SubjectSummary[];
  readonly publicationCount: number;
}

export interface CollectionDetail extends CollectionSummary {
  readonly publications: readonly PublicationSummary[];
}
