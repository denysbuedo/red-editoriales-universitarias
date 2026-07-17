import {
  normalizeOptionalText,
  normalizeOptionalUrl,
  requireCountryCode,
  requireNonEmptyText,
} from "./domain-guards";
import { PnpuUuid } from "../value-objects";
import { University } from "./university";

export interface ContactPoint {
  readonly email?: string;
  readonly telephone?: string;
  readonly url?: string;
}

export interface PublisherProps {
  readonly id: PnpuUuid;
  readonly officialName: string;
  readonly university: University;
  readonly country: string;
  readonly acronym?: string;
  readonly publisherCode?: string;
  readonly description?: string;
  readonly province?: string;
  readonly website?: string;
  readonly logo?: string;
  readonly contactPoint?: ContactPoint;
}

export class Publisher {
  private constructor(private readonly props: PublisherProps) {}

  public static create(props: PublisherProps): Publisher {
    return new Publisher({
      id: props.id,
      officialName: requireNonEmptyText(props.officialName, "Publisher official name"),
      university: props.university,
      country: requireCountryCode(props.country, "Publisher country"),
      acronym: normalizeOptionalText(props.acronym),
      publisherCode: normalizeOptionalText(props.publisherCode),
      description: normalizeOptionalText(props.description),
      province: normalizeOptionalText(props.province),
      website: normalizeOptionalUrl(props.website, "Publisher website"),
      logo: normalizeOptionalUrl(props.logo, "Publisher logo"),
      contactPoint: normalizeContactPoint(props.contactPoint),
    });
  }

  public id(): PnpuUuid {
    return this.props.id;
  }

  public officialName(): string {
    return this.props.officialName;
  }

  public university(): University {
    return this.props.university;
  }

  public snapshot(): PublisherProps {
    return {
      ...this.props,
      contactPoint:
        this.props.contactPoint === undefined ? undefined : { ...this.props.contactPoint },
    };
  }
}

function normalizeContactPoint(contactPoint: ContactPoint | undefined): ContactPoint | undefined {
  if (contactPoint === undefined) {
    return undefined;
  }

  return {
    email: normalizeOptionalText(contactPoint.email),
    telephone: normalizeOptionalText(contactPoint.telephone),
    url: normalizeOptionalUrl(contactPoint.url, "Publisher contact URL"),
  };
}
