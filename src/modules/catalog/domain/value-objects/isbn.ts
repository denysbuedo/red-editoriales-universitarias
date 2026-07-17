import { DomainValidationError } from "../errors/domain-validation-error";

const ISBN_PATTERN = /^(?:[0-9]{9}[0-9X]|97[89][0-9]{10})$/;

export class Isbn {
  private constructor(private readonly normalizedValue: string) {}

  public static create(value: string): Isbn {
    const normalizedValue = value.replace(/[\s-]/g, "").toUpperCase();

    if (normalizedValue.length === 0) {
      throw new DomainValidationError("ISBN is required.");
    }

    if (!ISBN_PATTERN.test(normalizedValue)) {
      throw new DomainValidationError("ISBN must be ISBN-10 or ISBN-13 without separators.");
    }

    if (!hasValidChecksum(normalizedValue)) {
      throw new DomainValidationError("ISBN check digit is invalid.");
    }

    return new Isbn(normalizedValue);
  }

  public value(): string {
    return this.normalizedValue;
  }

  public equals(other: Isbn): boolean {
    return this.normalizedValue === other.normalizedValue;
  }

  public toString(): string {
    return this.normalizedValue;
  }
}

function hasValidChecksum(value: string): boolean {
  return value.length === 10 ? hasValidIsbn10Checksum(value) : hasValidIsbn13Checksum(value);
}

function hasValidIsbn10Checksum(value: string): boolean {
  const checksum = value.split("").reduce((sum, character, index) => {
    const digit = character === "X" ? 10 : Number(character);
    return sum + digit * (10 - index);
  }, 0);

  return checksum % 11 === 0;
}

function hasValidIsbn13Checksum(value: string): boolean {
  const checksum = value.split("").reduce((sum, character, index) => {
    const weight = index % 2 === 0 ? 1 : 3;
    return sum + Number(character) * weight;
  }, 0);

  return checksum % 10 === 0;
}
