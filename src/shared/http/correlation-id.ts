const CORRELATION_ID_HEADER = "x-correlation-id";
const CORRELATION_ID_PATTERN = /^[a-zA-Z0-9._:-]{1,128}$/;

export function getCorrelationIdHeaderName(): string {
  return CORRELATION_ID_HEADER;
}

export function resolveCorrelationId(headers: Headers): string {
  const headerValue = headers.get(CORRELATION_ID_HEADER)?.trim();

  if (headerValue && CORRELATION_ID_PATTERN.test(headerValue)) {
    return headerValue;
  }

  return crypto.randomUUID();
}
