import { describe, expect, it } from "vitest";

import { buildHttpSecurityHeaders, httpSecurityHeaders } from "./http-security-headers";

describe("httpSecurityHeaders", () => {
  it("includes the security headers required by the security architecture", () => {
    const headerNames = httpSecurityHeaders.map((header) => header.key);

    expect(headerNames).toEqual(
      expect.arrayContaining([
        "Strict-Transport-Security",
        "X-Content-Type-Options",
        "X-Frame-Options",
        "Referrer-Policy",
        "Permissions-Policy",
        "Content-Security-Policy",
      ]),
    );
  });

  it("uses restrictive defaults for framing and MIME sniffing", () => {
    expect(httpSecurityHeaders).toContainEqual({
      key: "X-Frame-Options",
      value: "DENY",
    });
    expect(httpSecurityHeaders).toContainEqual({
      key: "X-Content-Type-Options",
      value: "nosniff",
    });
  });

  it("allows the configured public Omeka origin for catalog images", () => {
    const headers = buildHttpSecurityHeaders({
      PNPU_OMEKA_PUBLIC_BASE_URL: "https://catalogo.reduniv.edu.cu/",
    });
    const contentSecurityPolicy = headers.find(
      (header) => header.key === "Content-Security-Policy",
    )?.value;

    expect(contentSecurityPolicy).toContain(
      "img-src 'self' data: blob: https://catalogo.reduniv.edu.cu",
    );
  });
});
