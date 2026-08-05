import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { ApplicationError } from "@/modules/catalog/application";
import {
  authorizePublicationImportAdminRequest,
  authorizePublicationImportPublisherScopeRequest,
  publicationImportAdminErrorResponse,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-http";
import { readPublicationImportRoot } from "@/modules/publication-import/interfaces/http/publication-import-services";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

interface PublicationImportUploadResponse {
  readonly batchLabel: string;
  readonly fileName: string;
  readonly publisherId: string;
  readonly relativeSourcePath: string;
  readonly size: number;
  readonly uploadedAt: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const tokenResponse = await authorizePublicationImportAdminRequest(request, "diagnosis");
  if (tokenResponse !== null) {
    return tokenResponse;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const publisherId = readSafeSegment(formData.get("publisherId"), "publisherId");
    const batchLabel = readSafeSegment(formData.get("batchLabel") ?? "lote-piloto", "batchLabel");
    const publisherScopeResponse = await authorizePublicationImportPublisherScopeRequest(
      request,
      "upload",
      publisherId,
    );

    if (publisherScopeResponse !== null) {
      return publisherScopeResponse;
    }

    if (!(file instanceof File)) {
      throw ApplicationError.validation("Publication import upload file is required.");
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      throw ApplicationError.validation("Publication import upload must be an .xlsx file.");
    }

    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) {
      throw ApplicationError.validation(
        "Publication import upload size must be between 1 byte and 20 MB.",
      );
    }

    const uploadedAt = new Date();
    const uploadDirectory = `${toTimestamp(uploadedAt)}-${batchLabel}`;
    const fileName = normalizeUploadedFileName(file.name);
    const importRoot = path.resolve(readPublicationImportRoot());
    const relativeSourcePath = path.posix.join(
      "publishers",
      publisherId,
      uploadDirectory,
      fileName,
    );
    const targetPath = path.resolve(importRoot, relativeSourcePath);
    const relativeToRoot = path.relative(importRoot, targetPath);

    if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
      throw ApplicationError.validation(
        "Publication import upload target is outside the allowed root.",
      );
    }

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, Buffer.from(await file.arrayBuffer()), { flag: "wx" });

    const payload: PublicationImportUploadResponse = {
      batchLabel,
      fileName,
      publisherId,
      relativeSourcePath,
      size: file.size,
      uploadedAt: uploadedAt.toISOString(),
    };

    return NextResponse.json({
      data: payload,
      meta: {
        apiVersion: "v1",
      },
    });
  } catch (error) {
    return publicationImportAdminErrorResponse(request, error, "Publication import upload failed.");
  }
}

function readSafeSegment(value: FormDataEntryValue | null, field: string): string {
  if (typeof value !== "string") {
    throw ApplicationError.validation(`Publication import ${field} is required.`);
  }

  const normalized = value.trim().toLowerCase();

  if (!/^[a-z0-9][a-z0-9._-]{1,79}$/u.test(normalized)) {
    throw ApplicationError.validation(`Publication import ${field} has invalid characters.`);
  }

  return normalized;
}

function normalizeUploadedFileName(fileName: string): string {
  const baseName = fileName
    .split(/[\\/]/u)
    .at(-1)
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/^-+|-+$/gu, "");

  if (baseName === undefined || baseName.length === 0 || !baseName.endsWith(".xlsx")) {
    return "publicaciones.xlsx";
  }

  return baseName.slice(0, 120);
}

function toTimestamp(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/gu, "")
    .replace(/\.\d{3}Z$/u, "z")
    .toLowerCase();
}
