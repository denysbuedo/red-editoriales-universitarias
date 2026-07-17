import { DomainValidationError } from "../errors/domain-validation-error";

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

export function requireNonEmptyText(value: string, fieldName: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainValidationError(`${fieldName} is required.`);
  }

  return normalizedValue;
}

export function requireDefined<T>(value: T | undefined, fieldName: string): T {
  if (value === undefined) {
    throw new DomainValidationError(`${fieldName} is required.`);
  }

  return value;
}

export function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();
  return normalizedValue === undefined || normalizedValue.length === 0
    ? undefined
    : normalizedValue;
}

export function requireCountryCode(value: string, fieldName: string): string {
  const normalizedValue = value.trim().toUpperCase();

  if (!COUNTRY_CODE_PATTERN.test(normalizedValue)) {
    throw new DomainValidationError(`${fieldName} must be an ISO 3166-1 alpha-2 code.`);
  }

  return normalizedValue;
}

export function normalizeOptionalUrl(
  value: string | undefined,
  fieldName: string,
): string | undefined {
  const normalizedValue = normalizeOptionalText(value);

  if (normalizedValue === undefined) {
    return undefined;
  }

  try {
    return new URL(normalizedValue).toString();
  } catch {
    throw new DomainValidationError(`${fieldName} must be a valid URL.`);
  }
}

export function requireUrl(value: string, fieldName: string): string {
  const normalizedValue = requireNonEmptyText(value, fieldName);

  try {
    return new URL(normalizedValue).toString();
  } catch {
    throw new DomainValidationError(`${fieldName} must be a valid URL.`);
  }
}
