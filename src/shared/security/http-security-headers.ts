export interface HttpSecurityHeader {
  key: string;
  value: string;
}

interface HttpSecurityHeaderEnvironment {
  readonly [key: string]: string | undefined;
  readonly PNPU_OMEKA_PUBLIC_BASE_URL?: string;
}

export function buildHttpSecurityHeaders(
  environment: HttpSecurityHeaderEnvironment = process.env,
): HttpSecurityHeader[] {
  return [
    {
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    },
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(environment),
    },
  ];
}

export const httpSecurityHeaders: HttpSecurityHeader[] = buildHttpSecurityHeaders({});

export function applyHttpSecurityHeaders(headers: Headers): void {
  for (const header of buildHttpSecurityHeaders()) {
    headers.set(header.key, header.value);
  }
}

function buildContentSecurityPolicy(environment: HttpSecurityHeaderEnvironment): string {
  const imageSources = ["'self'", "data:", "blob:", ...readConfiguredImageSources(environment)];

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imageSources.join(" ")}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function readConfiguredImageSources(environment: HttpSecurityHeaderEnvironment): string[] {
  const value = environment.PNPU_OMEKA_PUBLIC_BASE_URL?.trim();

  if (!value) {
    return [];
  }

  try {
    const url = new URL(value);
    return [url.origin];
  } catch {
    return [];
  }
}
