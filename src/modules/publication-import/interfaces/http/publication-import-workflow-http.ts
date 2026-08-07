export interface PublicationImportWorkflowIdentity {
  readonly batchLabel: string;
  readonly fileName: string;
  readonly publisherId: string;
}

export function readPublicationImportWorkflowIdentityFromSourcePath(
  sourcePath: string,
): PublicationImportWorkflowIdentity {
  const normalizedPath = sourcePath.replace(/\\/gu, "/").toLowerCase();
  const match = /^publishers\/([^/]+)\/([^/]+)\/([^/]+\.xlsx)$/u.exec(normalizedPath);

  return {
    batchLabel: match?.[2] ?? "lote-manual",
    fileName: match?.[3] ?? readFileName(normalizedPath),
    publisherId: match?.[1] ?? "admin-nacional",
  };
}

function readFileName(sourcePath: string): string {
  return (
    sourcePath
      .split("/")
      .at(-1)
      ?.replace(/[^a-z0-9._-]+/gu, "-") ?? "publicaciones.xlsx"
  );
}
