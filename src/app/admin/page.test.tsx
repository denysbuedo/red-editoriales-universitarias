import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import AdminPage from "./page";

describe("AdminPage", () => {
  beforeEach(() => {
    cookiesMock.mockResolvedValue({
      get: () => ({
        value: buildUnsignedJwt({
          email: "admin@example.edu",
          preferred_username: "admin-pnpu",
        }),
      }),
    });
  });

  it("renders the protected administration index", async () => {
    const html = renderToStaticMarkup(await AdminPage());

    expect(html).toContain("Panel operativo PNPU");
    expect(html).toContain("Sesión OIDC activa");
    expect(html).toContain("admin-pnpu");
    expect(html).toContain("/admin/importaciones/publicaciones");
    expect(html).toContain("/api/admin/auth/logout");
  });
});

function buildUnsignedJwt(payload: Readonly<Record<string, string>>): string {
  return `${base64UrlEncode(JSON.stringify({ alg: "none" }))}.${base64UrlEncode(
    JSON.stringify(payload),
  )}.signature`;
}

function base64UrlEncode(value: string): string {
  let binary = "";

  for (const byte of new TextEncoder().encode(value)) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/gu, "-").replace(/\//gu, "_").replace(/=+$/u, "");
}
