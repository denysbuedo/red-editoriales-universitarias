import { DomainValidationError } from "../errors/domain-validation-error";

const LANGUAGE_CODE_PATTERN = /^[a-z]{2}$/;

export class LanguageCode {
  private constructor(private readonly normalizedValue: string) {}

  public static create(value: string): LanguageCode {
    const normalizedValue = value.trim().toLowerCase();

    if (normalizedValue.length === 0) {
      throw new DomainValidationError("Language code is required.");
    }

    if (!LANGUAGE_CODE_PATTERN.test(normalizedValue)) {
      throw new DomainValidationError("Language code must be an ISO 639-1 alpha-2 code.");
    }

    return new LanguageCode(normalizedValue);
  }

  public value(): string {
    return this.normalizedValue;
  }

  public equals(other: LanguageCode): boolean {
    return this.normalizedValue === other.normalizedValue;
  }

  public toString(): string {
    return this.normalizedValue;
  }
}
