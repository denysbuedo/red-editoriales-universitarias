import {
  normalizeOptionalText,
  normalizeOptionalUrl,
  requireCountryCode,
  requireNonEmptyText,
} from "./domain-guards";
import { PnpuUuid } from "../value-objects";

export interface UniversityProps {
  readonly id: PnpuUuid;
  readonly officialName: string;
  readonly acronym?: string;
  readonly universityCode?: string;
  readonly province?: string;
  readonly country: string;
  readonly website?: string;
}

export class University {
  private constructor(private readonly props: UniversityProps) {}

  public static create(props: UniversityProps): University {
    return new University({
      id: props.id,
      officialName: requireNonEmptyText(props.officialName, "University official name"),
      acronym: normalizeOptionalText(props.acronym),
      universityCode: normalizeOptionalText(props.universityCode),
      province: normalizeOptionalText(props.province),
      country: requireCountryCode(props.country, "University country"),
      website: normalizeOptionalUrl(props.website, "University website"),
    });
  }

  public id(): PnpuUuid {
    return this.props.id;
  }

  public officialName(): string {
    return this.props.officialName;
  }

  public country(): string {
    return this.props.country;
  }

  public snapshot(): UniversityProps {
    return { ...this.props };
  }
}
