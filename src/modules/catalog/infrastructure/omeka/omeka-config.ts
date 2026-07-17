import { ApplicationError } from "../../application";

export interface OmekaConfig {
  readonly baseUrl: string;
  readonly timeoutMs: number;
}

interface OmekaEnvironment {
  readonly [key: string]: string | undefined;
  readonly PNPU_OMEKA_BASE_URL?: string;
  readonly PNPU_OMEKA_TIMEOUT_MS?: string;
}

const DEFAULT_TIMEOUT_MS = 2_000;
const MAX_TIMEOUT_MS = 10_000;

export function readOmekaConfig(environment: OmekaEnvironment = process.env): OmekaConfig | null {
  const baseUrl = environment.PNPU_OMEKA_BASE_URL?.trim();

  if (baseUrl === undefined || baseUrl.length === 0) {
    return null;
  }

  return {
    baseUrl: normalizeBaseUrl(baseUrl),
    timeoutMs: normalizeTimeout(environment.PNPU_OMEKA_TIMEOUT_MS),
  };
}

function normalizeBaseUrl(value: string): string {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw ApplicationError.validation("PNPU_OMEKA_BASE_URL must be a valid URL.");
  }
}

function normalizeTimeout(value: string | undefined): number {
  if (value === undefined || value.trim().length === 0) {
    return DEFAULT_TIMEOUT_MS;
  }

  const timeoutMs = Number(value);

  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
    throw ApplicationError.validation(
      "PNPU_OMEKA_TIMEOUT_MS must be an integer between 1 and 10000.",
    );
  }

  return timeoutMs;
}
