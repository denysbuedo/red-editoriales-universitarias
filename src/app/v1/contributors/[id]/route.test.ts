import { describe, expect, it } from "vitest";

import { GET } from "./route";

const contributorId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01";

describe("GET /v1/contributors/{id}", () => {
  it("returns a contributor detail response", async () => {
    const request = new Request(`https://pnpu.mes.gob.cu/v1/contributors/${contributorId}`);
    const response = await GET(request, { params: Promise.resolve({ id: contributorId }) });

    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: contributorId,
        name: "Juana Perez Rodriguez",
        biography:
          "Investigadora vinculada a la gestion de informacion, arquitectura empresarial y gobierno de datos en instituciones universitarias.",
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

  it("returns PNPU-422 for invalid contributor identifiers", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/contributors/not-a-uuid", {
      headers: {
        "X-Correlation-Id": "contributor-request-1",
      },
    });
    const response = await GET(request, { params: Promise.resolve({ id: "not-a-uuid" }) });

    await expect(response.json()).resolves.toMatchObject({
      code: "PNPU-422",
      correlationId: "contributor-request-1",
    });
    expect(response.status).toBe(422);
  });
});
