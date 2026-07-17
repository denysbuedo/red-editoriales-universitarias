import packageJson from "../../../package.json";

const DEFAULT_PUBLIC_BASE_URL = "http://127.0.0.1:4307";
const SERVICE_NAME = "pnpu-portal";

export interface RuntimeConfig {
  serviceName: typeof SERVICE_NAME;
  version: string;
  commitSha: string | null;
  publicBaseUrl: string;
}

interface RuntimeEnvironment {
  [key: string]: string | undefined;
  PNPU_COMMIT_SHA?: string;
  PNPU_PUBLIC_BASE_URL?: string;
}

function readPublicBaseUrl(environment: RuntimeEnvironment): string {
  const value = environment.PNPU_PUBLIC_BASE_URL?.trim();

  if (!value) {
    return DEFAULT_PUBLIC_BASE_URL;
  }

  return new URL(value).toString().replace(/\/$/, "");
}

export function getRuntimeConfig(environment: RuntimeEnvironment = process.env): RuntimeConfig {
  const commitSha = environment.PNPU_COMMIT_SHA?.trim() ?? null;

  return {
    serviceName: SERVICE_NAME,
    version: packageJson.version,
    commitSha,
    publicBaseUrl: readPublicBaseUrl(environment),
  };
}
