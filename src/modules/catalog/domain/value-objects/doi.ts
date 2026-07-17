import { DomainValidationError } from "../errors/domain-validation-error";

const DOI_URI_PREFIX_PATTERN = /^https?:\/\/(?:dx\.)?doi\.org\//i;
const DOI_URN_PREFIX_PATTERN = /^doi:/i;
const DOI_PATTERN = /^10\.\S+\/\S+$/i;

export class Doi {
  private constructor(private readonly normalizedValue: string) {}

  public static create(value: string): Doi {
    const doiValue = value
      .trim()
      .replace(DOI_URI_PREFIX_PATTERN, "")
      .replace(DOI_URN_PREFIX_PATTERN, "")
      .toLowerCase();

    if (doiValue.length === 0) {
      throw new DomainValidationError("DOI is required.");
    }

    if (!DOI_PATTERN.test(doiValue)) {
      throw new DomainValidationError("DOI must start with 10. and include a registrant suffix.");
    }

    return new Doi(`https://doi.org/${doiValue}`);
  }

  public value(): string {
    return this.normalizedValue;
  }

  public equals(other: Doi): boolean {
    return this.normalizedValue === other.normalizedValue;
  }

  public toString(): string {
    return this.normalizedValue;
  }
}
