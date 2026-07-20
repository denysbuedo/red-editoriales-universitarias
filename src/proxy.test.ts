import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { proxy } from "./proxy";

describe("proxy", () => {
  afterEach(() => {
    delete process.env.PNPU_ADMIN_AUTH_MODE;
    delete process.env.PNPU_ENABLE_REQUEST_LOGS;
    delete process.env.PNPU_PUBLICATION_IMPORT_TOKEN;
  });

  it("protects the publication import admin page", async () => {
    process.env.PNPU_ENABLE_REQUEST_LOGS = "false";
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    const response = await proxy(
      new NextRequest("https://pnpu.mes.gob.cu/admin/importaciones/publicaciones"),
    );

    expect(response.status).toBe(403);
    await expect(response.text()).resolves.toContain("Acceso administrativo requerido");
  });

  it("accepts a valid admin token query and stores it in an HttpOnly cookie", async () => {
    process.env.PNPU_ENABLE_REQUEST_LOGS = "false";
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    const response = await proxy(
      new NextRequest(
        "https://pnpu.mes.gob.cu/admin/importaciones/publicaciones?adminToken=expected-token",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe(
      "https://pnpu.mes.gob.cu/admin/importaciones/publicaciones",
    );
    expect(response.headers.get("Set-Cookie")).toContain("pnpu_admin_token=expected-token");
    expect(response.headers.get("Set-Cookie")).toContain("HttpOnly");
  });

  it("accepts a valid admin token cookie", async () => {
    process.env.PNPU_ENABLE_REQUEST_LOGS = "false";
    process.env.PNPU_PUBLICATION_IMPORT_TOKEN = "expected-token";

    const response = await proxy(
      new NextRequest("https://pnpu.mes.gob.cu/admin/importaciones/publicaciones", {
        headers: {
          Cookie: "pnpu_admin_token=expected-token",
        },
      }),
    );

    expect(response.status).toBe(200);
  });
});
