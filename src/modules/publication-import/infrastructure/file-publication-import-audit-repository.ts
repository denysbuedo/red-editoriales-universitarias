import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { PublicationImportAuditEntryDto } from "../application/dtos";
import { PublicationImportAuditRepository } from "../application/ports/publication-import-audit-repository";

export class FilePublicationImportAuditRepository implements PublicationImportAuditRepository {
  public constructor(private readonly directory: string) {}

  public async append(entry: PublicationImportAuditEntryDto): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(
      path.join(this.directory, `${entry.id}.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
      "utf8",
    );
  }

  public async get(id: string): Promise<PublicationImportAuditEntryDto | null> {
    const fileName = `${id.trim()}.json`;

    if (!/^[\w-]+\.json$/u.test(fileName)) {
      return null;
    }

    try {
      return await readAuditEntry(path.join(this.directory, fileName));
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return null;
      }

      throw error;
    }
  }

  public async list(): Promise<readonly PublicationImportAuditEntryDto[]> {
    let fileNames: readonly string[];

    try {
      fileNames = await readdir(this.directory);
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return [];
      }

      throw error;
    }

    const entries = await Promise.all(
      fileNames
        .filter((fileName) => fileName.endsWith(".json"))
        .map(async (fileName) => readAuditEntry(path.join(this.directory, fileName))),
    );

    return entries.sort((left, right) => right.committedAt.localeCompare(left.committedAt));
  }
}

async function readAuditEntry(filePath: string): Promise<PublicationImportAuditEntryDto> {
  const payload = JSON.parse(await readFile(filePath, "utf8")) as unknown;

  if (!isAuditEntry(payload)) {
    throw new Error(`Invalid publication import audit entry: ${filePath}`);
  }

  return payload;
}

function isAuditEntry(payload: unknown): payload is PublicationImportAuditEntryDto {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "id" in payload &&
    "committedAt" in payload &&
    "source" in payload &&
    "sheet" in payload &&
    "status" in payload &&
    "summary" in payload &&
    "created" in payload
  );
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
