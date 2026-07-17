import { PaginationInput, PublicationListInput } from "../../application";

export function readPagination(searchParams: URLSearchParams): PaginationInput {
  return {
    page: readOptionalInteger(searchParams.get("page")),
    pageSize: readOptionalInteger(searchParams.get("pageSize")),
  };
}

export function readPublicationListQuery(searchParams: URLSearchParams): PublicationListInput {
  return {
    ...readPagination(searchParams),
    q: readOptionalText(searchParams.get("q")),
    publisherId: readOptionalText(searchParams.get("publisherId")),
    contributorId: readOptionalText(searchParams.get("contributorId")),
    collectionId: readOptionalText(searchParams.get("collectionId")),
    language: readOptionalText(searchParams.get("language")),
    subject: readOptionalText(searchParams.get("subject")),
    sort: readOptionalText(searchParams.get("sort")),
  };
}

function readOptionalInteger(value: string | null): number | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  return Number(value);
}

function readOptionalText(value: string | null): string | undefined {
  if (value === null || value.trim().length === 0) {
    return undefined;
  }

  return value;
}
