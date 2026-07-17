import { normalizeOptionalText, requireCountryCode, requireNonEmptyText } from "./domain-guards";
import { DomainValidationError } from "../errors/domain-validation-error";
import { Orcid, PnpuUuid } from "../value-objects";

export const CONTRIBUTOR_ROLES = [
  "author",
  "editor",
  "scientificEditor",
  "compiler",
  "translator",
  "illustrator",
  "reviewer",
  "contributor",
  "organization",
] as const;

export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number];

export interface ContributorProps {
  readonly id: PnpuUuid;
  readonly name: string;
  readonly roles: readonly ContributorRole[];
  readonly givenName?: string;
  readonly familyName?: string;
  readonly orcid?: Orcid;
  readonly affiliation?: string;
  readonly biography?: string;
  readonly country?: string;
}

export class Contributor {
  private constructor(private readonly props: ContributorProps) {}

  public static create(props: ContributorProps): Contributor {
    return new Contributor({
      id: props.id,
      name: requireNonEmptyText(props.name, "Contributor name"),
      roles: requireRoles(props.roles),
      givenName: normalizeOptionalText(props.givenName),
      familyName: normalizeOptionalText(props.familyName),
      orcid: props.orcid,
      affiliation: normalizeOptionalText(props.affiliation),
      biography: normalizeOptionalText(props.biography),
      country:
        props.country === undefined
          ? undefined
          : requireCountryCode(props.country, "Contributor country"),
    });
  }

  public id(): PnpuUuid {
    return this.props.id;
  }

  public name(): string {
    return this.props.name;
  }

  public roles(): readonly ContributorRole[] {
    return [...this.props.roles];
  }

  public snapshot(): ContributorProps {
    return { ...this.props, roles: [...this.props.roles] };
  }
}

function requireRoles(roles: readonly ContributorRole[]): readonly ContributorRole[] {
  if (roles.length === 0) {
    throw new DomainValidationError("Contributor roles are required.");
  }

  return [...new Set(roles)];
}
