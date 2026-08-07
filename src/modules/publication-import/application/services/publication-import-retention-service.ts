import { readdir, stat } from "node:fs/promises";
import path from "node:path";

import { PublicationImportRetentionPlanDto } from "../dtos";

interface PublicationImportRetentionServiceOptions {
  readonly importRoot: string;
  readonly now?: () => Date;
  readonly retentionDays: number;
}

interface RetentionCandidate {
  readonly absolutePath: string;
  readonly relativePath: string;
}

const XLSX_IMPORT_PATH_PATTERN = /^publishers\/[a-z0-9][a-z0-9._-]{1,79}\/[^/]+\/[^/]+\.xlsx$/u;

export class PublicationImportRetentionService {
  public constructor(private readonly options: PublicationImportRetentionServiceOptions) {}

  public async plan(): Promise<PublicationImportRetentionPlanDto> {
    const generatedAt = this.readNow();
    const cutoff =
      this.options.retentionDays > 0
        ? new Date(generatedAt.getTime() - this.options.retentionDays * 24 * 60 * 60 * 1000)
        : null;
    const candidates = await this.listCandidates();
    const files = await Promise.all(
      candidates.map(async (candidate) => {
        const fileStats = await stat(candidate.absolutePath);
        const modifiedAt = fileStats.mtime;
        const expired = cutoff !== null && modifiedAt < cutoff;

        return {
          expired,
          modifiedAt: modifiedAt.toISOString(),
          relativePath: candidate.relativePath,
          size: fileStats.size,
        };
      }),
    );

    const sortedFiles = files.sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath, "es"),
    );
    const expiredFiles = sortedFiles.filter((file) => file.expired);

    return {
      generatedAt: generatedAt.toISOString(),
      retentionDays: this.options.retentionDays,
      cutoff: cutoff?.toISOString() ?? null,
      summary: {
        files: sortedFiles.length,
        expiredFiles: expiredFiles.length,
        bytes: sortedFiles.reduce((total, file) => total + file.size, 0),
        expiredBytes: expiredFiles.reduce((total, file) => total + file.size, 0),
      },
      files: sortedFiles,
    };
  }

  private readNow(): Date {
    return this.options.now?.() ?? new Date();
  }

  private async listCandidates(): Promise<readonly RetentionCandidate[]> {
    const importRoot = path.resolve(this.options.importRoot);

    try {
      return await listXlsxFiles(importRoot, importRoot);
    } catch (error) {
      if (isMissingDirectory(error)) {
        return [];
      }

      throw error;
    }
  }
}

async function listXlsxFiles(
  root: string,
  currentDirectory: string,
): Promise<RetentionCandidate[]> {
  const entries = await readdir(currentDirectory, { withFileTypes: true });
  const candidates: RetentionCandidate[] = [];

  for (const entry of entries) {
    const absolutePath = path.resolve(currentDirectory, entry.name);
    const relativePath = path.relative(root, absolutePath).replace(/\\/gu, "/");

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      candidates.push(...(await listXlsxFiles(root, absolutePath)));
      continue;
    }

    if (entry.isFile() && XLSX_IMPORT_PATH_PATTERN.test(relativePath)) {
      candidates.push({ absolutePath, relativePath });
    }
  }

  return candidates;
}

function isMissingDirectory(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === "ENOENT"
  );
}
