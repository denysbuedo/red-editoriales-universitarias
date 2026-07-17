import { describe, expect, it } from "vitest";

import { GET } from "./route";

const collectionId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c08";

describe("GET /v1/collections/{id}", () => {
  it("returns a collection detail response", async () => {
    const request = new Request(`https://pnpu.mes.gob.cu/v1/collections/${collectionId}`);
    const response = await GET(request, { params: Promise.resolve({ id: collectionId }) });

    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: collectionId,
        title: "Arquitectura y gobierno universitario",
        publications: [
          {
            id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05",
            title: "Arquitectura empresarial para universidades",
          },
        ],
      },
    });
    expect(response.status).toBe(200);
  });
});
