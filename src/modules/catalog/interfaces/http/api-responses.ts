import { NextResponse } from "next/server";

import { ApplicationError, PaginatedResult, Pagination } from "../../application";
import { getCorrelationIdHeaderName, resolveCorrelationId } from "@/shared/http/correlation-id";

export interface ApiLinks {
  readonly self: string;
  readonly next?: string;
  readonly prev?: string;
}

export interface ApiMeta {
  readonly apiVersion: "v1";
}

export interface ApiCollectionResponse<T> {
  readonly data: readonly T[];
  readonly pagination: Pagination;
  readonly links: ApiLinks;
  readonly meta: ApiMeta;
}

export interface ApiItemResponse<T> {
  readonly data: T;
  readonly links: Pick<ApiLinks, "self">;
  readonly meta: ApiMeta;
}

export interface ApiErrorResponse {
  readonly code: string;
  readonly message: string;
  readonly correlationId: string;
}

export function collectionResponse<T>(
  request: Request,
  result: PaginatedResult<T>,
): NextResponse<ApiCollectionResponse<T>> {
  return NextResponse.json({
    data: result.data,
    pagination: result.pagination,
    links: buildPaginationLinks(request, result.pagination),
    meta: { apiVersion: "v1" },
  });
}

export function itemResponse<T>(request: Request, data: T): NextResponse<ApiItemResponse<T>> {
  return NextResponse.json({
    data,
    links: { self: request.url },
    meta: { apiVersion: "v1" },
  });
}

export function errorResponse(request: Request, error: unknown): NextResponse<ApiErrorResponse> {
  const correlationId = resolveCorrelationId(request.headers);
  const response =
    error instanceof ApplicationError
      ? NextResponse.json(
          {
            code: error.code,
            message: error.message,
            correlationId,
          },
          { status: statusForApplicationError(error) },
        )
      : NextResponse.json(
          {
            code: "PNPU-503",
            message: "Service unavailable.",
            correlationId,
          },
          { status: 503 },
        );

  response.headers.set(getCorrelationIdHeaderName(), correlationId);
  return response;
}

function statusForApplicationError(error: ApplicationError): number {
  if (error.code === "PNPU-404") {
    return 404;
  }

  if (error.code === "PNPU-422") {
    return 422;
  }

  if (error.code === "PNPU-429") {
    return 429;
  }

  return error.code === "PNPU-409" ? 409 : 503;
}

function buildPaginationLinks(request: Request, pagination: Pagination): ApiLinks {
  const self = new URL(request.url);
  const links: { self: string; next?: string; prev?: string } = {
    self: self.toString(),
  };

  if (pagination.page < pagination.totalPages) {
    const next = new URL(self);
    next.searchParams.set("page", String(pagination.page + 1));
    next.searchParams.set("pageSize", String(pagination.pageSize));
    links.next = next.toString();
  }

  if (pagination.page > 1 && pagination.totalPages > 0) {
    const prev = new URL(self);
    prev.searchParams.set("page", String(pagination.page - 1));
    prev.searchParams.set("pageSize", String(pagination.pageSize));
    links.prev = prev.toString();
  }

  return links;
}
