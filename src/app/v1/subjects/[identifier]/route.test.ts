import { describe, expect, it } from "vitest";

import { GET } from "./route";

const subjectIdentifier = "unesco:1203";
const encodedSubjectIdentifier = "unesco%3A1203";

describe("GET /v1/subjects/{identifier}", () => {
  it("returns a subject detail response", async () => {
    const request = new Request(`https://pnpu.mes.gob.cu/v1/subjects/${encodedSubjectIdentifier}`);
    const response = await GET(request, {
      params: Promise.resolve({ identifier: encodedSubjectIdentifier }),
    });

    await expect(response.json()).resolves.toMatchObject({
      data: {
        identifier: subjectIdentifier,
        preferredLabel: "Ciencia de los ordenadores",
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

  it("returns PNPU-404 for unknown subjects", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/subjects/unesco%3A9999");
    const response = await GET(request, {
      params: Promise.resolve({ identifier: "unesco%3A9999" }),
    });

    await expect(response.json()).resolves.toMatchObject({
      code: "PNPU-404",
    });
    expect(response.status).toBe(404);
  });
});
