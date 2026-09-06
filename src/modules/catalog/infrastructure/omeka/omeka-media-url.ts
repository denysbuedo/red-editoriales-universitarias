import { OmekaJsonObject } from "./omeka-api-client";

export function readTopLevelString(resource: OmekaJsonObject, field: string): string | null {
  const value = resource[field];

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

export function rewriteLocalOmekaResourceUrl(
  url: string,
  publicBaseUrl: string | undefined,
): string {
  if (publicBaseUrl === undefined) {
    return url;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname !== "127.0.0.1" && parsedUrl.hostname !== "localhost") {
      return url;
    }

    const publicBase = new URL(publicBaseUrl);

    return new URL(`${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`, publicBase)
      .toString()
      .replace(/\/$/, "");
  } catch {
    return url;
  }
}
