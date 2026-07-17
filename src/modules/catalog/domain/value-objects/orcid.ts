import { DomainValidationError } from "../errors/domain-validation-error";

const ORCID_URI_PREFIX_PATTERN = /^https?:\/\/orcid\.org\//i;
const ORCID_PATTERN = /^[0-9]{15}[0-9X]$/;

export class Orcid {
  private constructor(private readonly normalizedValue: string) {}

  public static create(value: string): Orcid {
    const compactValue = value
      .trim()
      .replace(ORCID_URI_PREFIX_PATTERN, "")
      .replace(/[\s-]/g, "")
      .toUpperCase();

    if (compactValue.length === 0) {
      throw new DomainValidationError("ORCID is required.");
    }

    if (!ORCID_PATTERN.test(compactValue)) {
      throw new DomainValidationError("ORCID must contain 16 digits, allowing X as check digit.");
    }

    if (!hasValidOrcidChecksum(compactValue)) {
      throw new DomainValidationError("ORCID check digit is invalid.");
    }

    return new Orcid(`https://orcid.org/${formatOrcid(compactValue)}`);
  }

  public value(): string {
    return this.normalizedValue;
  }

  public equals(other: Orcid): boolean {
    return this.normalizedValue === other.normalizedValue;
  }

  public toString(): string {
    return this.normalizedValue;
  }
}

function hasValidOrcidChecksum(value: string): boolean {
  const total = value
    .slice(0, 15)
    .split("")
    .reduce((sum, character) => (sum + Number(character)) * 2, 0);
  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const expectedCheckDigit = result === 10 ? "X" : String(result);

  return value.at(15) === expectedCheckDigit;
}

function formatOrcid(value: string): string {
  return `${value.slice(0, 4)}-${value.slice(4, 8)}-${value.slice(8, 12)}-${value.slice(12)}`;
}
