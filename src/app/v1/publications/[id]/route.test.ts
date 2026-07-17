import { describe, expect, it } from "vitest";

import { GET } from "./route";

const publicationId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c05";

describe("GET /v1/publications/{id}", () => {
  it("returns a publication detail response", async () => {
    const request = new Request(`https://pnpu.mes.gob.cu/v1/publications/${publicationId}`);
    const response = await GET(request, { params: Promise.resolve({ id: publicationId }) });

    await expect(response.json()).resolves.toMatchObject({
      data: {
        id: publicationId,
        title: "Arquitectura empresarial para universidades",
        subtitle: "Gobierno, integración y sostenibilidad tecnológica",
        license: "CC BY",
        format: "application/pdf",
        contributors: [
          {
            id: "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c01",
            name: "Juana Perez Rodriguez",
            roles: ["author"],
            orcid: "https://orcid.org/0000-0002-1825-0097",
          },
        ],
        identifiers: [{ type: "isbn", value: "9789590000003" }],
        subjects: [
          {
            identifier: "unesco:1203",
            preferredLabel: "Ciencia de los ordenadores",
            uri: "https://pnpu.mes.gob.cu/vocabularies/subjects/1203",
          },
        ],
        resources: [
          {
            type: "pdf",
            format: "application/pdf",
            fileSize: 2457600,
            checksum: "d41d8cd98f00b204e9800998ecf8427e",
            language: "es",
            license: "CC BY",
          },
        ],
        keywords: ["arquitectura empresarial", "universidades", "gobierno de datos"],
      },
      links: {
        self: `https://pnpu.mes.gob.cu/v1/publications/${publicationId}`,
      },
      meta: {
        apiVersion: "v1",
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns PNPU-404 for missing publications", async () => {
    const missingId = "018f6e2d-7b58-7d61-9b7d-1f4c2f9a1c09";
    const request = new Request(`https://pnpu.mes.gob.cu/v1/publications/${missingId}`, {
      headers: {
        "X-Correlation-Id": "request-404",
      },
    });
    const response = await GET(request, { params: Promise.resolve({ id: missingId }) });

    await expect(response.json()).resolves.toEqual({
      code: "PNPU-404",
      message: "Publication not found.",
      correlationId: "request-404",
    });
    expect(response.status).toBe(404);
  });

  it("returns PNPU-422 for invalid publication identifiers", async () => {
    const request = new Request("https://pnpu.mes.gob.cu/v1/publications/not-a-uuid");
    const response = await GET(request, { params: Promise.resolve({ id: "not-a-uuid" }) });
    const payload: unknown = await response.json();

    expect(payload).toMatchObject({
      code: "PNPU-422",
    });
    expect(response.status).toBe(422);
  });
});
