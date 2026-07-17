import { ApplicationError } from "./errors/application-error";

export interface PaginationInput {
  readonly page?: number;
  readonly pageSize?: number;
}

export interface Pagination {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
  readonly totalPages: number;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly pagination: Pagination;
}

export interface PageRequest {
  readonly page: number;
  readonly pageSize: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function normalizePagination(input: PaginationInput = {}): PageRequest {
  const page = input.page ?? DEFAULT_PAGE;
  const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;

  if (!Number.isInteger(page) || page < 1) {
    throw ApplicationError.validation(
      "Pagination page must be an integer greater than or equal to 1.",
    );
  }

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw ApplicationError.validation("Pagination pageSize must be an integer between 1 and 100.");
  }

  return { page, pageSize };
}

export function paginateItems<T>(items: readonly T[], request: PageRequest): PaginatedResult<T> {
  const total = items.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / request.pageSize);
  const start = (request.page - 1) * request.pageSize;
  const end = start + request.pageSize;

  return {
    data: items.slice(start, end),
    pagination: {
      page: request.page,
      pageSize: request.pageSize,
      total,
      totalPages,
    },
  };
}
