import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authorizePublicationImportAdminRequest } from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";
import { areRequestLogsEnabled, writeStructuredLog } from "@/shared/observability/logger";

const ADMIN_PAGE_PATH_PREFIX = "/admin";
const ADMIN_PAGE_TOKEN_COOKIE = "pnpu_admin_token";
const ADMIN_PAGE_TOKEN_QUERY_PARAM = "adminToken";

export async function proxy(request: NextRequest) {
  const correlationIdHeaderName = getCorrelationIdHeaderName();
  const correlationId = resolveCorrelationId(request.headers);
  const requestHeaders = new Headers(request.headers);
  const path = request.nextUrl.pathname;

  requestHeaders.set(correlationIdHeaderName, correlationId);

  if (areRequestLogsEnabled()) {
    writeStructuredLog({
      level: "info",
      service: "pnpu-portal",
      event: "http.request",
      correlationId,
      method: request.method,
      path,
    });
  }

  if (isAdminPagePath(path)) {
    const pageAuthResponse = await authorizeAdminPageRequest(request, requestHeaders);

    if (pageAuthResponse !== null) {
      pageAuthResponse.headers.set(correlationIdHeaderName, correlationId);
      return pageAuthResponse;
    }
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(correlationIdHeaderName, correlationId);

  return response;
}

async function authorizeAdminPageRequest(
  request: NextRequest,
  requestHeaders: Headers,
): Promise<NextResponse | null> {
  const queryToken = request.nextUrl.searchParams.get(ADMIN_PAGE_TOKEN_QUERY_PARAM);
  const cookieToken = request.cookies.get(ADMIN_PAGE_TOKEN_COOKIE)?.value;

  if (requestHeaders.get("X-PNPU-Admin-Token") === null) {
    if (queryToken !== null && queryToken.trim().length > 0) {
      requestHeaders.set("X-PNPU-Admin-Token", queryToken);
    } else if (cookieToken !== undefined && cookieToken.trim().length > 0) {
      requestHeaders.set("X-PNPU-Admin-Token", cookieToken);
    }
  }

  const authRequest = new Request(request.url, {
    headers: requestHeaders,
    method: request.method,
  });
  const authResponse = await authorizePublicationImportAdminRequest(authRequest, "admin page");

  if (authResponse !== null) {
    return adminPageUnauthorizedResponse(request.nextUrl, authResponse.status);
  }

  if (queryToken !== null) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete(ADMIN_PAGE_TOKEN_QUERY_PARAM);
    const response = NextResponse.redirect(redirectUrl);

    response.cookies.set(ADMIN_PAGE_TOKEN_COOKIE, queryToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: ADMIN_PAGE_PATH_PREFIX,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });

    return response;
  }

  return null;
}

function adminPageUnauthorizedResponse(requestUrl: URL, status: number): NextResponse {
  if (shouldRedirectAdminPageToOidcLogin()) {
    const loginUrl = new URL("/api/admin/auth/login", requestUrl);
    loginUrl.searchParams.set("returnTo", requestUrl.pathname);

    return NextResponse.redirect(loginUrl);
  }

  return new NextResponse(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Acceso administrativo requerido</title></head><body><main><h1>Acceso administrativo requerido</h1><p>Use una sesion OIDC valida o un token administrativo local autorizado.</p></main></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
      status,
    },
  );
}

function isAdminPagePath(path: string): boolean {
  return path === ADMIN_PAGE_PATH_PREFIX || path.startsWith(`${ADMIN_PAGE_PATH_PREFIX}/`);
}

function shouldRedirectAdminPageToOidcLogin(): boolean {
  const authMode = process.env.PNPU_ADMIN_AUTH_MODE?.trim().toLowerCase();

  return authMode === "oidc" || authMode === "hybrid";
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
