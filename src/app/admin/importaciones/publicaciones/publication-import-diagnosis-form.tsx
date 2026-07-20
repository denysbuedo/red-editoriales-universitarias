"use client";

import { SyntheticEvent, useState } from "react";

import { PublicationImportBatchSnapshot } from "@/modules/publication-import";

interface PublicationImportDiagnosisApiResponse {
  readonly data: PublicationImportBatchSnapshot;
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
  const [batch, setBatch] = useState<PublicationImportBatchSnapshot | null>(null);
  const [error, setError] = useState<PublicationImportDiagnosisApiError | null>(null);

  async function submitDiagnosis(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setBatch(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/publication-imports/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PNPU-Admin-Token": token,
        },
        body: JSON.stringify({
          sourcePath,
          sheet,
        }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      setBatch(readApiResponse(payload).data);
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudo ejecutar el diagnostico de importacion.",
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
          void submitDiagnosis(event);
        }}
      >
        <h2 className="text-xl font-semibold text-neutral-950">Ejecutar diagnóstico</h2>
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
          <button
            className="h-10 rounded-md bg-green-900 px-4 text-sm font-semibold text-white hover:bg-green-950 disabled:cursor-not-allowed disabled:bg-neutral-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Diagnosticando" : "Diagnosticar"}
          </button>
        </div>
      </form>

      <section
        aria-live="polite"
        className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-xl font-semibold text-neutral-950">Resultado</h2>
        {error !== null ? <ErrorPanel error={error} /> : null}
        {batch !== null ? <BatchDiagnostics batch={batch} /> : null}
        {error === null && batch === null ? (
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Ejecute un diagnóstico para ver el estado del lote, errores de planilla y campos
            pendientes antes de cualquier mapeo.
          </p>
        ) : null}
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

function readApiResponse(payload: unknown): PublicationImportDiagnosisApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportDiagnosisApiResponse;
  }

  throw new Error("Invalid publication import diagnosis response.");
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
