"use client";

import { SyntheticEvent, useState } from "react";

import {
  PublicationImportBatchSnapshot,
  PublicationImportMappingPreviewDto,
} from "@/modules/publication-import";

interface PublicationImportDiagnosisApiResponse {
  readonly data: PublicationImportBatchSnapshot;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportMappingPreviewApiResponse {
  readonly data: PublicationImportMappingPreviewDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportDiagnosisApiError {
  readonly code: string;
  readonly message: string;
  readonly correlationId?: string;
}

export function PublicationImportDiagnosisForm() {
  const [sourcePath, setSourcePath] = useState("Listado_Libro_Publicados_EDUNIV.xlsx");
  const [sheet, setSheet] = useState("EDUNIV");
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<"diagnose" | "preview">("diagnose");
  const [batch, setBatch] = useState<PublicationImportBatchSnapshot | null>(null);
  const [preview, setPreview] = useState<PublicationImportMappingPreviewDto | null>(null);
  const [error, setError] = useState<PublicationImportDiagnosisApiError | null>(null);

  async function submitImportAction(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setBatch(null);
    setPreview(null);
    setError(null);
    const selectedAction = readSubmitAction(event);
    setAction(selectedAction);

    try {
      const response = await fetch(endpointForAction(selectedAction), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PNPU-Admin-Token": token,
        },
        body: JSON.stringify({
          sourcePath,
          sheet,
          maxRows: selectedAction === "preview" ? 25 : undefined,
        }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      if (selectedAction === "preview") {
        setPreview(readPreviewApiResponse(payload).data);
      } else {
        setBatch(readApiResponse(payload).data);
      }
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudo ejecutar la operacion de importacion.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
      <form
        className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => {
          void submitImportAction(event);
        }}
      >
        <h2 className="text-xl font-semibold text-neutral-950">Ejecutar revisión</h2>
        <div className="mt-5 grid gap-4">
          <label className="grid gap-1 text-sm font-medium text-neutral-800">
            Archivo XLSX
            <input
              className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
              maxLength={260}
              onChange={(event) => {
                setSourcePath(event.target.value);
              }}
              required
              type="text"
              value={sourcePath}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-neutral-800">
            Hoja
            <input
              className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
              maxLength={64}
              onChange={(event) => {
                setSheet(event.target.value);
              }}
              required
              type="text"
              value={sheet}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-neutral-800">
            Token administrativo
            <input
              autoComplete="off"
              className="h-10 rounded-md border border-neutral-300 px-3 text-sm font-normal text-neutral-950"
              onChange={(event) => {
                setToken(event.target.value);
              }}
              required
              type="password"
              value={token}
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="h-10 rounded-md bg-green-900 px-4 text-sm font-semibold text-white hover:bg-green-950 disabled:cursor-not-allowed disabled:bg-neutral-400"
              disabled={isSubmitting}
              name="intent"
              type="submit"
              value="diagnose"
            >
              {isSubmitting && action === "diagnose" ? "Diagnosticando" : "Diagnosticar"}
            </button>
            <button
              className="h-10 rounded-md border border-green-800 px-4 text-sm font-semibold text-green-900 hover:bg-green-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
              disabled={isSubmitting}
              name="intent"
              type="submit"
              value="preview"
            >
              {isSubmitting && action === "preview" ? "Preparando" : "Preview mapeo"}
            </button>
          </div>
        </div>
      </form>

      <section
        aria-live="polite"
        className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-neutral-950">Resultado</h2>
        {error !== null ? <ErrorPanel error={error} /> : null}
        {batch !== null ? <BatchDiagnostics batch={batch} /> : null}
        {preview !== null ? <MappingPreview preview={preview} /> : null}
        {error === null && batch === null && preview === null ? (
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Ejecute un diagnóstico para ver el estado del lote, errores de planilla y campos
            pendientes antes de cualquier mapeo.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function MappingPreview({ preview }: { readonly preview: PublicationImportMappingPreviewDto }) {
  const enrichmentMatrix = buildEnrichmentMatrix(preview);

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-neutral-700">
          Preview generado para revisión operativa. No se escribió en Omeka S ni PostgreSQL.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-neutral-300 px-4 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            onClick={() => {
              exportPreviewJson(preview);
            }}
            type="button"
          >
            Exportar JSON
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-md border border-green-800 px-4 text-sm font-semibold text-green-900 hover:bg-green-50"
            onClick={() => {
              exportEnrichmentCsv(preview);
            }}
            type="button"
          >
            Exportar plantilla
          </button>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Filas" value={preview.summary.totalRows} />
        <Metric label="Mapeables" value={preview.summary.mappable} />
        <Metric label="Enriquecer" value={preview.summary.needsEnrichment} />
        <Metric label="Rechazadas" value={preview.summary.rejected} />
      </dl>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <CompactList items={preview.unresolvedPublishers} title="Editoriales sin resolver" />
        <CompactList
          items={preview.unresolvedGenresOrPublicationTypes}
          title="Géneros/tipos sin resolver"
        />
        <CompactList items={preview.formatsWithoutDigitalResource} title="Formatos sin recurso" />
      </div>

      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-neutral-950">Matriz de enriquecimiento</h3>
            <p className="mt-1 text-sm leading-6 text-neutral-700">
              Campos que deben completarse antes de preparar escritura en Omeka S.
            </p>
          </div>
          <span className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-neutral-800">
            {enrichmentMatrix.rows.length} fila
            {enrichmentMatrix.rows.length === 1 ? "" : "s"}
          </span>
        </div>
        <dl className="mt-4 grid gap-3 md:grid-cols-3">
          <Metric label="Campos PNPU" value={enrichmentMatrix.missingPnpuFields.length} />
          <Metric label="Editoriales" value={enrichmentMatrix.publishers.length} />
          <Metric label="Géneros/tipos" value={enrichmentMatrix.genres.length} />
        </dl>
        <div className="mt-4 grid gap-4 xl:grid-cols-4">
          <CompactList items={enrichmentMatrix.missingPnpuFields} title="Campos por completar" />
          <CompactList items={enrichmentMatrix.publishers} title="Autoridad editorial" />
          <CompactList items={enrichmentMatrix.genres} title="Vocabulario pendiente" />
          <CompactList items={enrichmentMatrix.formats} title="Recurso digital requerido" />
        </div>
      </section>

      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Filas evaluadas</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-600">
                <th className="py-2 pr-4 font-semibold">Fila</th>
                <th className="py-2 pr-4 font-semibold">Decisión</th>
                <th className="py-2 pr-4 font-semibold">Título</th>
                <th className="py-2 pr-4 font-semibold">ISBN</th>
                <th className="py-2 pr-4 font-semibold">Causa</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr className="border-b border-neutral-100 align-top last:border-0" key={row.row}>
                  <td className="py-2 pr-4 font-semibold text-neutral-950">{row.row}</td>
                  <td className="py-2 pr-4">
                    <span className={decisionClassName(row.decision)}>
                      {formatDecision(row.decision)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-neutral-800">{row.title || "sin título"}</td>
                  <td className="py-2 pr-4 text-neutral-700">{row.normalizedIsbn || "sin ISBN"}</td>
                  <td className="py-2 pr-4 text-neutral-700">{row.reasons.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BatchDiagnostics({ batch }: { readonly batch: PublicationImportBatchSnapshot }) {
  const summary = batch.diagnostics.summary;
  const dateFormats = batch.diagnostics.publicationDateFormats;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={statusClassName(batch.status)}>{formatStatus(batch.status)}</span>
        <span className="text-sm text-neutral-600">Lote {batch.id}</span>
      </div>

      <dl className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Registros" value={summary.rowCount} />
        <Metric label="Completos" value={summary.rowsWithRequiredSpreadsheetFields} />
        <Metric label="Campos vacíos" value={summary.missingFieldCount} />
        <Metric label="ISBN inválidos" value={summary.invalidIsbnCount} />
        <Metric label="ISBN duplicados" value={summary.duplicateIsbnCount} />
        <Metric label="Fechas inválidas" value={summary.invalidPublicationDateCount} />
      </dl>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <IssueList
          emptyText="No se detectaron filas incompletas."
          items={batch.diagnostics.missingRows.map((row) => ({
            key: `missing-${String(row.row)}`,
            label: `Fila ${String(row.row)}`,
            value: `${row.missingFields.join(", ")} | ${row.title || "sin titulo"}`,
          }))}
          title="Filas con campos vacíos"
        />
        <IssueList
          emptyText="No se detectaron ISBN duplicados."
          items={batch.diagnostics.duplicateIsbns.map((duplicate) => ({
            key: `duplicate-${duplicate.isbn}`,
            label: duplicate.isbn,
            value: `${String(duplicate.count)} apariciones: filas ${duplicate.rows.map((row) => String(row.row)).join(", ")}`,
          }))}
          title="ISBN duplicados"
        />
      </div>

      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Fechas</h3>
        <dl className="mt-3 grid gap-3 sm:grid-cols-5">
          <Metric label="Vacías" value={dateFormats.empty} />
          <Metric label="Año" value={dateFormats.yearOnly} />
          <Metric label="Mes/año" value={dateFormats.monthYear} />
          <Metric label="ISO" value={dateFormats.isoDate} />
          <Metric label="Inválidas" value={dateFormats.invalid} />
        </dl>
      </section>

      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Campos PNPU pendientes</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {summary.missingPnpuEnrichmentFields.map((field) => (
            <span
              className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-neutral-700"
              key={field}
            >
              {field}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-700">
          {batch.diagnostics.mappingAssessment.reason}
        </p>
      </section>
    </div>
  );
}

function ErrorPanel({ error }: { readonly error: PublicationImportDiagnosisApiError }) {
  return (
    <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-900">
        {error.code}: {error.message}
      </p>
      {error.correlationId ? (
        <p className="mt-2 text-xs text-red-800">Correlación: {error.correlationId}</p>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { readonly label: string; readonly value: number | string }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-3">
      <dt className="text-xs font-semibold uppercase tracking-normal text-neutral-600">{label}</dt>
      <dd className="mt-1 text-xl font-bold text-neutral-950">{value}</dd>
    </div>
  );
}

function IssueList({
  emptyText,
  items,
  title,
}: {
  readonly emptyText: string;
  readonly items: readonly {
    readonly key: string;
    readonly label: string;
    readonly value: string;
  }[];
  readonly title: string;
}) {
  return (
    <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-700">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 8).map((item) => (
            <li className="rounded-md bg-white px-3 py-2 text-sm" key={item.key}>
              <span className="font-semibold text-neutral-900">{item.label}: </span>
              <span className="text-neutral-700">{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CompactList({
  items,
  title,
}: {
  readonly items: readonly string[];
  readonly title: string;
}) {
  return (
    <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-700">Sin incidencias.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          {items.slice(0, 8).map((item) => (
            <li className="rounded-md bg-white px-3 py-2" key={item}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatStatus(status: PublicationImportBatchSnapshot["status"]): string {
  if (status === "needs_correction") {
    return "requiere corrección";
  }

  if (status === "ready_for_mapping") {
    return "listo para mapeo";
  }

  if (status === "rejected") {
    return "rechazado";
  }

  return "diagnosticado";
}

function statusClassName(status: PublicationImportBatchSnapshot["status"]): string {
  const baseClassName = "rounded-md px-2 py-1 text-xs font-semibold";

  if (status === "needs_correction" || status === "rejected") {
    return `${baseClassName} bg-amber-50 text-amber-900`;
  }

  return `${baseClassName} bg-green-50 text-green-900`;
}

function formatDecision(
  decision: PublicationImportMappingPreviewDto["rows"][number]["decision"],
): string {
  if (decision === "needs_enrichment") {
    return "enriquecer";
  }

  if (decision === "rejected") {
    return "rechazada";
  }

  return "mapeable";
}

function decisionClassName(
  decision: PublicationImportMappingPreviewDto["rows"][number]["decision"],
): string {
  const baseClassName = "rounded-md px-2 py-1 text-xs font-semibold";

  if (decision === "rejected") {
    return `${baseClassName} bg-red-50 text-red-800`;
  }

  if (decision === "needs_enrichment") {
    return `${baseClassName} bg-amber-50 text-amber-900`;
  }

  return `${baseClassName} bg-green-50 text-green-900`;
}

function readSubmitAction(event: SyntheticEvent<HTMLFormElement>): "diagnose" | "preview" {
  const nativeEvent = event.nativeEvent as SubmitEvent;
  const submitter = nativeEvent.submitter;

  if (submitter instanceof HTMLButtonElement && submitter.value === "preview") {
    return "preview";
  }

  return "diagnose";
}

function endpointForAction(action: "diagnose" | "preview"): string {
  return action === "preview"
    ? "/api/admin/publication-imports/mapping-preview"
    : "/api/admin/publication-imports/diagnose";
}

function exportPreviewJson(preview: PublicationImportMappingPreviewDto): void {
  const blob = new Blob([JSON.stringify(preview, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildPreviewFileName(preview);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportEnrichmentCsv(preview: PublicationImportMappingPreviewDto): void {
  const matrix = buildEnrichmentMatrix(preview);
  const header = [
    "row",
    "title",
    "isbn",
    "publisher",
    "publisherAuthorityId",
    "genreOrPublicationType",
    "controlledTypeOrGenre",
    "formats",
    "digitalResourceUrl",
    "language",
    "subjects",
    "license",
    "notes",
  ];
  const rows = matrix.rows.map((row) => [
    String(row.row),
    row.title,
    row.normalizedIsbn,
    row.publisher,
    "",
    row.genreOrPublicationType,
    "",
    row.formats.join("|"),
    "",
    "",
    "",
    "",
    row.reasons.join(" "),
  ]);
  const csv = [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildEnrichmentFileName(preview);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildEnrichmentMatrix(preview: PublicationImportMappingPreviewDto): {
  readonly formats: readonly string[];
  readonly genres: readonly string[];
  readonly missingPnpuFields: readonly string[];
  readonly publishers: readonly string[];
  readonly rows: PublicationImportMappingPreviewDto["rows"];
} {
  const rows = preview.rows.filter((row) => row.decision === "needs_enrichment");

  return {
    formats: distinctValues(rows.flatMap((row) => row.formats)),
    genres: distinctValues(rows.map((row) => row.genreOrPublicationType)),
    missingPnpuFields: distinctValues(rows.flatMap((row) => row.missingPnpuFields)),
    publishers: distinctValues(rows.map((row) => row.publisher)),
    rows,
  };
}

function distinctValues(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "es"),
  );
}

function escapeCsvCell(value: string): string {
  return `"${value.replace(/"/gu, '""')}"`;
}

function buildPreviewFileName(preview: PublicationImportMappingPreviewDto): string {
  const source =
    preview.source
      .split(/[\\/]/u)
      .at(-1)
      ?.replace(/\.xlsx$/iu, "") ?? "lote";
  const timestamp = preview.generatedAt.replace(/[:.]/gu, "-");

  return `pnpu-preview-mapeo-${source}-${timestamp}.json`;
}

function buildEnrichmentFileName(preview: PublicationImportMappingPreviewDto): string {
  const source =
    preview.source
      .split(/[\\/]/u)
      .at(-1)
      ?.replace(/\.xlsx$/iu, "") ?? "lote";
  const timestamp = preview.generatedAt.replace(/[:.]/gu, "-");

  return `pnpu-plantilla-enriquecimiento-${source}-${timestamp}.csv`;
}

function readApiResponse(payload: unknown): PublicationImportDiagnosisApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportDiagnosisApiResponse;
  }

  throw new Error("Invalid publication import diagnosis response.");
}

function readPreviewApiResponse(payload: unknown): PublicationImportMappingPreviewApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportMappingPreviewApiResponse;
  }

  throw new Error("Invalid publication import mapping preview response.");
}

function readApiError(payload: unknown): PublicationImportDiagnosisApiError {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    "message" in payload
  ) {
    const error = payload as {
      readonly code: unknown;
      readonly message: unknown;
      readonly correlationId?: unknown;
    };
    return {
      code: typeof error.code === "string" ? error.code : "PNPU-503",
      message: typeof error.message === "string" ? error.message : "Error de diagnóstico.",
      correlationId: typeof error.correlationId === "string" ? error.correlationId : undefined,
    };
  }

  return {
    code: "PNPU-503",
    message: "Error de diagnóstico.",
  };
}
