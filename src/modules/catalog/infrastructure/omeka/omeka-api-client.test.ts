import { describe, expect, it, vi } from "vitest";

import { ApplicationError } from "../../application";
import { HttpOmekaApiClient } from "./omeka-api-client";

const config = {
  baseUrl: "https://omeka.example.edu",
  timeoutMs: 2000,
};

type FetchMock = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

describe("HttpOmekaApiClient", () => {
  it("lists Omeka items with page and per_page query parameters", async () => {
    const fetchMock = vi
      .fn<FetchMock>()
      .mockResolvedValue(
        Response.json([{ "@id": "https://omeka.example.edu/api/items/1", "o:id": 1 }]),
      );
    const client = new HttpOmekaApiClient(config, fetchMock);

    await expect(client.listItems({ page: 2, pageSize: 25 })).resolves.toEqual([
      { "@id": "https://omeka.example.edu/api/items/1", "o:id": 1 },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://omeka.example.edu/api/items?page=2&per_page=25"),
      expect.objectContaining({
        headers: {
          Accept: "application/json",
        },
      }),
    );
  });

  it("returns null when an Omeka item does not exist", async () => {
    const fetchMock = vi.fn<FetchMock>().mockResolvedValue(new Response(null, { status: 404 }));
    const client = new HttpOmekaApiClient(config, fetchMock);

    await expect(client.getItem(404)).resolves.toBeNull();
  });

  it("rejects invalid Omeka item identifiers", async () => {
    const client = new HttpOmekaApiClient(config, fetch);

    await expect(client.getItem(0)).rejects.toMatchObject({
      code: "PNPU-422",
    });
  });

  it("maps network errors to PNPU-503", async () => {
    const fetchMock = vi.fn<FetchMock>().mockRejectedValue(new Error("network down"));
    const client = new HttpOmekaApiClient(config, fetchMock);

    await expect(client.listItems({ page: 1, pageSize: 10 })).rejects.toMatchObject({
      code: "PNPU-503",
      message: "Omeka S is unavailable.",
    });
  });

  it("maps invalid Omeka payloads to PNPU-503", async () => {
    const fetchMock = vi.fn<FetchMock>().mockResolvedValue(Response.json({ invalid: true }));
    const client = new HttpOmekaApiClient(config, fetchMock);

    await expect(client.listItems({ page: 1, pageSize: 10 })).rejects.toBeInstanceOf(
      ApplicationError,
    );
  });
});
