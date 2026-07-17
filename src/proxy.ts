import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";
import { areRequestLogsEnabled, writeStructuredLog } from "@/shared/observability/logger";

export function proxy(request: NextRequest) {
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

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set(correlationIdHeaderName, correlationId);

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
