import { ApplicationError } from "../../application";
import { HttpOmekaApiClient } from "./omeka-api-client";
import { OmekaConfig } from "./omeka-config";

export type OmekaHealthStatus = "available" | "unavailable";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export async function checkOmekaHealth(
  config: OmekaConfig,
  fetchFn: FetchLike = fetch,
): Promise<OmekaHealthStatus> {
  const client = new HttpOmekaApiClient(config, fetchFn);

  try {
    await client.listItems({ page: 1, pageSize: 1 });
    return "available";
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "PNPU-503") {
      return "unavailable";
    }

    throw error;
  }
}
