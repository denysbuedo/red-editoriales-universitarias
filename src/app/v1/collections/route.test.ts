import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /v1/collections", () => {
  it("returns paginated collections", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/collections?page=1&pageSize=10");
    const response = await GET(request);

    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08",
          title: "Arquitectura y gobierno universitario",
          collectionCode: "UH-AGU",
          publicationCount: 1,
        },
      ],
      pagination: { total: 1 },
    });
    expect(response.status).toBe(200);
  });
});
