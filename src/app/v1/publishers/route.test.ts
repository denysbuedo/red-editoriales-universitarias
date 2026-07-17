import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /v1/publishers", () => {
  it("returns a paginated publisher summary response", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/publishers?page=1&pageSize=10");
    const response = await GET(request);

    await expect(response.json()).resolves.toMatchObject({
      data: [
        {
          id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c03",
          officialName: "Editorial Universidad de La Habana",
          country: "CU",
        },
      ],
      pagination: {
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
      links: {
        self: "https://pnpu.mes.gob.cu/v1/publishers?page=1&pageSize=10",
      },
      meta: {
        apiVersion: "v1",
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns PNPU-422 for invalid pagination", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/publishers?pageSize=0", {
      headers: {
        "X-Correlation-Id": "publisher-request-1",
      },
    });
    const response = await GET(request);

    await expect(response.json()).resolves.toEqual({
      code: "PNPU-422",
      message: "Pagination pageSize must be an integer between 1 and 100.",
      correlationId: "publisher-request-1",
    });
    expect(response.status).toBe(422);
  });
});
