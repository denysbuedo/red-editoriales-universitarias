export interface PublisherSummary {
  readonly id: string;
  readonly officialName: string;
  readonly acronym?: string;
  readonly country: string;
}

export interface PublisherDetail extends PublisherSummary {
  readonly university: {
    readonly id: string;
    readonly officialName: string;
    readonly acronym?: string;
    readonly province?: string;
    readonly country: string;
    readonly website?: string;
  };
  readonly publisherCode?: string;
  readonly description?: string;
  readonly province?: string;
  readonly website?: string;
  readonly logo?: string;
  readonly contactPoint?: {
    readonly email?: string;
    readonly telephone?: string;
    readonly url?: string;
  };
}
