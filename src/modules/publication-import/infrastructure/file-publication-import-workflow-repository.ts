import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  PublicationImportWorkflowBatchDetailDto,
  PublicationImportWorkflowBatchDto,
  PublicationImportWorkflowEventDto,
} from "../application/dtos";
import {
  PublicationImportWorkflowRecordCommand,
  PublicationImportWorkflowRepository,
} from "../application/ports/publication-import-workflow-repository";

interface WorkflowManifest {
  readonly batch: PublicationImportWorkflowBatchDto;
  readonly events: readonly PublicationImportWorkflowEventDto[];
}

export class FilePublicationImportWorkflowRepository implements PublicationImportWorkflowRepository {
  public constructor(private readonly directory: string) {}

  public async list(command?: {
    readonly publisherId?: string;
  }): Promise<readonly PublicationImportWorkflowBatchDto[]> {
    await mkdir(this.directory, { recursive: true });

    const files = await readdir(this.directory);
    const manifests = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => this.readManifest(path.join(this.directory, file))),
    );

    return manifests
      .flatMap((manifest) => (manifest === null ? [] : [manifest.batch]))
      .filter(
        (batch) => command?.publisherId === undefined || batch.publisherId === command.publisherId,
      )
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  public async read(command: {
    readonly relativeSourcePath: string;
  }): Promise<PublicationImportWorkflowBatchDetailDto | null> {
    return this.readManifest(this.manifestPath(command.relativeSourcePath));
  }

  public async record(
    command: PublicationImportWorkflowRecordCommand,
  ): Promise<PublicationImportWorkflowBatchDetailDto> {
    await mkdir(this.directory, { recursive: true });

    const now = new Date().toISOString();
    const previous = await this.read(command);
    const event: PublicationImportWorkflowEventDto = {
      at: now,
      message: command.message,
      status: command.status,
    };
    const batch: PublicationImportWorkflowBatchDto = {
      batchLabel: command.batchLabel,
      createdAt: previous?.batch.createdAt ?? now,
      fileName: command.fileName,
      lastEventAt: now,
      publisherId: command.publisherId,
      relativeSourcePath: command.relativeSourcePath,
      sheet: command.sheet ?? previous?.batch.sheet,
      status: command.status,
      updatedAt: now,
    };
    const manifest: WorkflowManifest = {
      batch,
      events: [...(previous?.events ?? []), event],
    };

    await writeFile(
      this.manifestPath(command.relativeSourcePath),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf-8",
    );

    return manifest;
  }

  private async readManifest(manifestPath: string): Promise<WorkflowManifest | null> {
    try {
      const payload = JSON.parse(await readFile(manifestPath, "utf-8")) as unknown;

      return isWorkflowManifest(payload) ? payload : null;
    } catch {
      return null;
    }
  }

  private manifestPath(relativeSourcePath: string): string {
    return path.join(this.directory, `${encodeURIComponent(relativeSourcePath)}.json`);
  }
}

function isWorkflowManifest(value: unknown): value is WorkflowManifest {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "batch" in value &&
    "events" in value &&
    isWorkflowBatch(value.batch) &&
    Array.isArray(value.events)
  );
}

function isWorkflowBatch(value: unknown): value is PublicationImportWorkflowBatchDto {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "relativeSourcePath" in value &&
    "publisherId" in value &&
    "status" in value
  );
}
