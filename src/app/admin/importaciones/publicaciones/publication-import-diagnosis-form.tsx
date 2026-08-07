"use client";

import { SyntheticEvent, useState } from "react";

import {
  PublicationImportBatchSnapshot,
  PublicationImportAuthoritiesDto,
  PublicationImportAuditLogDto,
  PublicationImportCommitDto,
  PublicationImportCommitPlanDto,
  PublicationImportDryRunDto,
  PublicationImportMappingPreviewDto,
  PublicationImportRollbackDto,
  PublicationImportRollbackPlanDto,
  PublicationImportWorkflowBatchDetailDto,
  PublicationImportWorkflowListDto,
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

interface PublicationImportDryRunApiResponse {
  readonly data: PublicationImportDryRunDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportCommitPlanApiResponse {
  readonly data: PublicationImportCommitPlanDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportCommitApiResponse {
  readonly data: PublicationImportCommitDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportAuthoritiesApiResponse {
  readonly data: PublicationImportAuthoritiesDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportHistoryApiResponse {
  readonly data: PublicationImportAuditLogDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportRollbackPlanApiResponse {
  readonly data: PublicationImportRollbackPlanDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportRollbackApiResponse {
  readonly data: PublicationImportRollbackDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportWorkflowListApiResponse {
  readonly data: PublicationImportWorkflowListDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportWorkflowDetailApiResponse {
  readonly data: PublicationImportWorkflowBatchDetailDto;
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

interface PublicationImportDiagnosisApiError {
  readonly code: string;
  readonly message: string;
  readonly correlationId?: string;
}

interface PublicationImportUploadApiResponse {
  readonly data: {
    readonly batchLabel: string;
    readonly fileName: string;
    readonly publisherId: string;
    readonly relativeSourcePath: string;
    readonly size: number;
    readonly uploadedAt: string;
  };
  readonly meta: {
    readonly apiVersion: "v1";
  };
}

const textInputClassName =
  "min-h-10 w-full min-w-0 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-normal text-neutral-950";
const textareaClassName =
  "min-h-32 w-full min-w-0 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-normal text-neutral-950";
const primaryButtonClassName =
  "inline-flex min-h-10 w-full items-center justify-center rounded-md bg-blue-900 px-4 py-2 text-center text-sm font-semibold leading-5 text-white hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-neutral-400";
const secondaryButtonClassName =
  "inline-flex min-h-10 w-full items-center justify-center rounded-md border border-blue-800 bg-white px-4 py-2 text-center text-sm font-semibold leading-5 text-blue-900 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400";
const neutralButtonClassName =
  "inline-flex min-h-10 w-full items-center justify-center rounded-md border border-neutral-500 bg-white px-4 py-2 text-center text-sm font-semibold leading-5 text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400";
const dangerButtonClassName =
  "inline-flex min-h-10 w-full items-center justify-center rounded-md bg-red-900 px-4 py-2 text-center text-sm font-semibold leading-5 text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:bg-neutral-400";
const labelClassName = "grid min-w-0 gap-1 text-sm font-medium text-neutral-800";

export function PublicationImportDiagnosisForm() {
  const [sourcePath, setSourcePath] = useState("Listado_Libro_Publicados_EDUNIV.xlsx");
  const [sheet, setSheet] = useState("EDUNIV");
  const [token, setToken] = useState("");
  const [publisherId, setPublisherId] = useState("editorial-piloto");
  const [batchLabel, setBatchLabel] = useState("primer-lote");
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<PublicationImportWorkflowListDto | null>(null);
  const [workflowDetail, setWorkflowDetail] =
    useState<PublicationImportWorkflowBatchDetailDto | null>(null);
  const [reviewQueue, setReviewQueue] = useState<PublicationImportWorkflowListDto | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [rollbackAuditId, setRollbackAuditId] = useState("");
  const [enrichmentCsv, setEnrichmentCsv] = useState("");
  const [packageJson, setPackageJson] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [action, setAction] = useState<PublicationImportAction>("diagnose");
  const [authorities, setAuthorities] = useState<PublicationImportAuthoritiesDto | null>(null);
  const [batch, setBatch] = useState<PublicationImportBatchSnapshot | null>(null);
  const [commit, setCommit] = useState<PublicationImportCommitDto | null>(null);
  const [commitPlan, setCommitPlan] = useState<PublicationImportCommitPlanDto | null>(null);
  const [dryRun, setDryRun] = useState<PublicationImportDryRunDto | null>(null);
  const [history, setHistory] = useState<PublicationImportAuditLogDto | null>(null);
  const [preview, setPreview] = useState<PublicationImportMappingPreviewDto | null>(null);
  const [rollback, setRollback] = useState<PublicationImportRollbackDto | null>(null);
  const [rollbackPlan, setRollbackPlan] = useState<PublicationImportRollbackPlanDto | null>(null);
  const [error, setError] = useState<PublicationImportDiagnosisApiError | null>(null);

  async function uploadSpreadsheet(event: SyntheticEvent<HTMLInputElement>): Promise<void> {
    const file = event.currentTarget.files?.[0];

    if (file === undefined) {
      return;
    }

    setIsSubmitting(true);
    setUploadStatus(null);
    setError(null);

    try {
      const formData = new FormData();
      formData.set("publisherId", publisherId);
      formData.set("batchLabel", batchLabel);
      formData.set("file", file);
      const headers = new Headers();

      if (token.trim().length > 0) {
        headers.set("X-PNPU-Admin-Token", token.trim());
      }

      const response = await fetch("/api/admin/publication-imports/upload", {
        body: formData,
        headers,
        method: "POST",
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      const upload = readUploadApiResponse(payload).data;
      setSourcePath(upload.relativeSourcePath);
      setUploadStatus(`Archivo cargado para ${upload.publisherId}: ${upload.relativeSourcePath}`);
      await refreshWorkflow(upload.publisherId);
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudo subir el archivo de publicaciones.",
      });
    } finally {
      setIsSubmitting(false);
      event.currentTarget.value = "";
    }
  }

  async function refreshWorkflow(selectedPublisherId = publisherId): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const headers = new Headers();

      if (token.trim().length > 0) {
        headers.set("X-PNPU-Admin-Token", token.trim());
      }

      const response = await fetch(
        `/api/admin/publication-imports/batches?publisherId=${encodeURIComponent(selectedPublisherId.trim().toLowerCase())}`,
        {
          headers,
          method: "GET",
        },
      );
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      setWorkflow(readWorkflowListApiResponse(payload).data);
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudieron cargar los lotes de importación.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitCurrentBatchForReview(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const headers = new Headers({
        "Content-Type": "application/json",
      });

      if (token.trim().length > 0) {
        headers.set("X-PNPU-Admin-Token", token.trim());
      }

      const response = await fetch("/api/admin/publication-imports/batches/review", {
        body: JSON.stringify({ sourcePath }),
        headers,
        method: "POST",
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      const detail = readWorkflowDetailApiResponse(payload).data;
      setWorkflowDetail(detail);
      setWorkflow((current) =>
        current === null
          ? null
          : {
              ...current,
              batches: current.batches.map((batch) =>
                batch.relativeSourcePath === detail.batch.relativeSourcePath ? detail.batch : batch,
              ),
            },
      );
      setUploadStatus(`Lote enviado a revisión: ${detail.batch.relativeSourcePath}`);
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudo enviar el lote a revisión.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function refreshReviewQueue(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const headers = new Headers();

      if (token.trim().length > 0) {
        headers.set("X-PNPU-Admin-Token", token.trim());
      }

      const response = await fetch("/api/admin/publication-imports/review-queue", {
        headers,
        method: "GET",
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      setReviewQueue(readWorkflowListApiResponse(payload).data);
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudo cargar la cola de revisión nacional.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function selectWorkflowBatch(batchSourcePath: string): Promise<void> {
    setSourcePath(batchSourcePath);
    await loadWorkflowBatchDetail(batchSourcePath);
  }

  async function loadWorkflowBatchDetail(batchSourcePath: string): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const headers = new Headers();

      if (token.trim().length > 0) {
        headers.set("X-PNPU-Admin-Token", token.trim());
      }

      const response = await fetch(
        `/api/admin/publication-imports/batches/detail?sourcePath=${encodeURIComponent(batchSourcePath)}`,
        {
          headers,
          method: "GET",
        },
      );
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      setWorkflowDetail(readWorkflowDetailApiResponse(payload).data);
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudo cargar el detalle del lote.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitReviewDecision(
    decision: "approved" | "rejected",
    selectedSourcePath = sourcePath,
  ): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const headers = new Headers({
        "Content-Type": "application/json",
      });

      if (token.trim().length > 0) {
        headers.set("X-PNPU-Admin-Token", token.trim());
      }

      const response = await fetch("/api/admin/publication-imports/review-decision", {
        body: JSON.stringify({
          decision,
          message: reviewMessage,
          sourcePath: selectedSourcePath,
        }),
        headers,
        method: "POST",
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      const detail = readWorkflowDetailApiResponse(payload).data;

      setWorkflowDetail(detail);
      setReviewQueue((current) =>
        current === null
          ? null
          : {
              ...current,
              batches: current.batches.filter(
                (batch) => batch.relativeSourcePath !== detail.batch.relativeSourcePath,
              ),
              summary: {
                ...current.summary,
                readyForReview: Math.max(0, current.summary.readyForReview - 1),
                total: Math.max(0, current.summary.total - 1),
              },
            },
      );
      setWorkflow((current) =>
        current === null
          ? null
          : {
              ...current,
              batches: current.batches.map((batch) =>
                batch.relativeSourcePath === detail.batch.relativeSourcePath ? detail.batch : batch,
              ),
            },
      );
      setUploadStatus(
        decision === "approved"
          ? `Lote aprobado: ${detail.batch.relativeSourcePath}`
          : `Lote rechazado: ${detail.batch.relativeSourcePath}`,
      );
    } catch {
      setError({
        code: "PNPU-503",
        message: "No se pudo registrar la decisión de revisión nacional.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitImportAction(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setIsSubmitting(true);
    setAuthorities(null);
    setBatch(null);
    setCommit(null);
    setCommitPlan(null);
    setDryRun(null);
    setHistory(null);
    setPreview(null);
    setRollback(null);
    setRollbackPlan(null);
    setError(null);
    const selectedAction = readSubmitAction(event);
    setAction(selectedAction);

    try {
      const headers = new Headers({
        "Content-Type": "application/json",
      });

      if (token.trim().length > 0) {
        headers.set("X-PNPU-Admin-Token", token.trim());
      }

      const response = await fetch(endpointForAction(selectedAction), {
        method: selectedAction === "authorities" || selectedAction === "history" ? "GET" : "POST",
        headers,
        body:
          selectedAction === "authorities" || selectedAction === "history"
            ? undefined
            : JSON.stringify({
                sourcePath,
                sheet,
                packageJson:
                  selectedAction === "commitPlan" || selectedAction === "commit"
                    ? packageJson
                    : undefined,
                enrichmentCsv: selectedAction === "dryRun" ? enrichmentCsv : undefined,
                auditId:
                  selectedAction === "rollbackPlan" || selectedAction === "rollback"
                    ? rollbackAuditId
                    : undefined,
                maxRows: selectedAction === "preview" ? 25 : undefined,
              }),
      });
      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        setError(readApiError(payload));
        return;
      }

      if (selectedAction === "authorities") {
        setAuthorities(readAuthoritiesApiResponse(payload).data);
      } else if (selectedAction === "commit") {
        setCommit(readCommitApiResponse(payload).data);
      } else if (selectedAction === "dryRun") {
        setDryRun(readDryRunApiResponse(payload).data);
      } else if (selectedAction === "commitPlan") {
        setCommitPlan(readCommitPlanApiResponse(payload).data);
      } else if (selectedAction === "preview") {
        setPreview(readPreviewApiResponse(payload).data);
      } else if (selectedAction === "history") {
        setHistory(readHistoryApiResponse(payload).data);
      } else if (selectedAction === "rollbackPlan") {
        setRollbackPlan(readRollbackPlanApiResponse(payload).data);
      } else if (selectedAction === "rollback") {
        setRollback(readRollbackApiResponse(payload).data);
      } else {
        setBatch(readApiResponse(payload).data);
      }

      if (
        selectedAction === "diagnose" ||
        selectedAction === "preview" ||
        selectedAction === "dryRun" ||
        selectedAction === "commit"
      ) {
        await refreshWorkflow();
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
    <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(360px,460px)_minmax(0,1fr)]">
      <form
        className="min-w-0 rounded-md border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
        onSubmit={(event) => {
          void submitImportAction(event);
        }}
      >
        <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-950">Panel operativo</h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Carga, validación y escritura controlada por lote.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:w-56">
            <a
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-blue-800 bg-white px-3 py-2 text-center text-sm font-semibold leading-5 text-blue-900 hover:bg-blue-50"
              href="/api/admin/auth/login?returnTo=/admin/importaciones/publicaciones"
            >
              Entrar
            </a>
            <a
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-neutral-500 bg-white px-3 py-2 text-center text-sm font-semibold leading-5 text-neutral-800 hover:bg-neutral-50"
              href="/api/admin/auth/logout"
            >
              Salir
            </a>
          </div>
        </div>

        <div className="mt-5 grid min-w-0 gap-4">
          <section className="rounded-md border border-blue-200 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-950">1. Lote editorial</h3>
            <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
              <label className={labelClassName}>
                Editorial piloto
                <input
                  className={textInputClassName}
                  maxLength={80}
                  onChange={(event) => {
                    setPublisherId(event.target.value);
                  }}
                  pattern="[A-Za-z0-9._-]{2,80}"
                  required
                  type="text"
                  value={publisherId}
                />
              </label>
              <label className={labelClassName}>
                Lote
                <input
                  className={textInputClassName}
                  maxLength={80}
                  onChange={(event) => {
                    setBatchLabel(event.target.value);
                  }}
                  pattern="[A-Za-z0-9._-]{2,80}"
                  required
                  type="text"
                  value={batchLabel}
                />
              </label>
            </div>
            <label className={`${labelClassName} mt-3`}>
              Subir XLSX
              <input
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="w-full min-w-0 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-normal text-neutral-950 file:mr-3 file:rounded-md file:border-0 file:bg-blue-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
                disabled={isSubmitting}
                onChange={(event) => {
                  void uploadSpreadsheet(event);
                }}
                type="file"
              />
            </label>
            {uploadStatus === null ? null : (
              <p className="mt-3 break-words rounded-md bg-white px-3 py-2 text-xs font-semibold leading-5 text-blue-950">
                {uploadStatus}
              </p>
            )}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <a
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-blue-800 bg-white px-3 py-2 text-center text-sm font-semibold leading-5 text-blue-900 hover:bg-blue-50"
                href="/api/admin/publication-imports/templates/publications.csv"
              >
                Plantilla base
              </a>
              <a
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-blue-800 bg-white px-3 py-2 text-center text-sm font-semibold leading-5 text-blue-900 hover:bg-blue-50"
                href="/api/admin/publication-imports/templates/enrichment.csv"
              >
                Plantilla PNPU
              </a>
            </div>
          </section>

          <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-950">2. Revisión inicial</h3>
            <div className="mt-3 grid min-w-0 gap-3">
              <label className={labelClassName}>
                Archivo XLSX
                <input
                  className={textInputClassName}
                  maxLength={260}
                  onChange={(event) => {
                    setSourcePath(event.target.value);
                  }}
                  required
                  type="text"
                  value={sourcePath}
                />
              </label>
              <label className={labelClassName}>
                Hoja
                <input
                  className={textInputClassName}
                  maxLength={64}
                  onChange={(event) => {
                    setSheet(event.target.value);
                  }}
                  required
                  type="text"
                  value={sheet}
                />
              </label>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                className={primaryButtonClassName}
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="diagnose"
              >
                {isSubmitting && action === "diagnose" ? "Diagnosticando" : "Diagnosticar"}
              </button>
              <button
                className={secondaryButtonClassName}
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="preview"
              >
                {isSubmitting && action === "preview" ? "Preparando" : "Preview mapeo"}
              </button>
            </div>
          </section>

          <section className="rounded-md border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-950">3. Catálogo de apoyo</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                className={neutralButtonClassName}
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="authorities"
              >
                {isSubmitting && action === "authorities" ? "Cargando" : "Autoridades"}
              </button>
              <button
                className={neutralButtonClassName}
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="history"
              >
                {isSubmitting && action === "history" ? "Cargando" : "Historial"}
              </button>
            </div>
          </section>

          <section className="rounded-md border border-blue-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-neutral-950">4. Lotes de la editorial</h3>
              <button
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-blue-800 bg-white px-3 py-2 text-center text-sm font-semibold leading-5 text-blue-900 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
                disabled={isSubmitting}
                onClick={() => {
                  void refreshWorkflow();
                }}
                type="button"
              >
                Actualizar lotes
              </button>
            </div>
            <WorkflowBatches
              onSelect={(batchSourcePath) => {
                void selectWorkflowBatch(batchSourcePath);
              }}
              workflow={workflow}
            />
            <WorkflowBatchDetail detail={workflowDetail} />
            <button
              className={`${secondaryButtonClassName} mt-3`}
              disabled={isSubmitting}
              onClick={() => {
                void submitCurrentBatchForReview();
              }}
              type="button"
            >
              Enviar lote actual a revisión
            </button>
          </section>

          <section className="rounded-md border border-neutral-300 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-neutral-950">5. Revisión nacional</h3>
              <button
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-neutral-700 bg-white px-3 py-2 text-center text-sm font-semibold leading-5 text-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
                disabled={isSubmitting}
                onClick={() => {
                  void refreshReviewQueue();
                }}
                type="button"
              >
                Cargar cola
              </button>
            </div>
            <ReviewQueue
              onApprove={(batchSourcePath) => {
                void submitReviewDecision("approved", batchSourcePath);
              }}
              onReject={(batchSourcePath) => {
                void submitReviewDecision("rejected", batchSourcePath);
              }}
              onSelect={(batchSourcePath) => {
                void selectWorkflowBatch(batchSourcePath);
              }}
              reviewQueue={reviewQueue}
            />
            <label className={`${labelClassName} mt-3`}>
              Nota de revisión
              <input
                className={textInputClassName}
                maxLength={240}
                onChange={(event) => {
                  setReviewMessage(event.target.value);
                }}
                placeholder="Opcional"
                type="text"
                value={reviewMessage}
              />
            </label>
          </section>

          <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-950">6. Enriquecimiento</h3>
            <label className={`${labelClassName} mt-3`}>
              CSV enriquecido
              <textarea
                className={textareaClassName}
                onChange={(event) => {
                  setEnrichmentCsv(event.target.value);
                }}
                placeholder="Pegue aqui la plantilla de enriquecimiento completada."
                value={enrichmentCsv}
              />
            </label>
            <button
              className={`${primaryButtonClassName} mt-3 bg-neutral-900 hover:bg-black`}
              disabled={isSubmitting}
              name="intent"
              type="submit"
              value="dryRun"
            >
              {isSubmitting && action === "dryRun" ? "Validando" : "Dry-run enriquecido"}
            </button>
          </section>

          <details className="rounded-md border border-neutral-200 bg-white p-4">
            <summary className="cursor-pointer text-sm font-semibold text-neutral-950">
              Acceso local
            </summary>
            <label className={`${labelClassName} mt-3`}>
              Token administrativo local
              <input
                autoComplete="off"
                className={textInputClassName}
                onChange={(event) => {
                  setToken(event.target.value);
                }}
                type="password"
                value={token}
              />
            </label>
          </details>

          <details className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-amber-950">
              Escritura en Omeka
            </summary>
            <label className={`${labelClassName} mt-3`}>
              Paquete validado
              <textarea
                className={textareaClassName}
                onChange={(event) => {
                  setPackageJson(event.target.value);
                }}
                placeholder="Pegue aqui el JSON exportado con candidatos listos."
                value={packageJson}
              />
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-amber-800 bg-white px-4 py-2 text-center text-sm font-semibold leading-5 text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="commitPlan"
              >
                {isSubmitting && action === "commitPlan" ? "Planificando" : "Plan de commit"}
              </button>
              <button
                className={dangerButtonClassName}
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="commit"
              >
                {isSubmitting && action === "commit" ? "Escribiendo" : "Escribir en Omeka"}
              </button>
            </div>
          </details>

          <details className="rounded-md border border-red-200 bg-red-50 p-4">
            <summary className="cursor-pointer text-sm font-semibold text-red-950">
              Rollback
            </summary>
            <label className={`${labelClassName} mt-3`}>
              Audit ID
              <input
                className={textInputClassName}
                maxLength={80}
                onChange={(event) => {
                  setRollbackAuditId(event.target.value);
                }}
                placeholder="Identificador de auditoria"
                type="text"
                value={rollbackAuditId}
              />
            </label>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-red-800 bg-white px-4 py-2 text-center text-sm font-semibold leading-5 text-red-900 hover:bg-red-100 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="rollbackPlan"
              >
                {isSubmitting && action === "rollbackPlan" ? "Planificando" : "Plan de rollback"}
              </button>
              <button
                className={dangerButtonClassName}
                disabled={isSubmitting}
                name="intent"
                type="submit"
                value="rollback"
              >
                {isSubmitting && action === "rollback" ? "Revirtiendo" : "Ejecutar rollback"}
              </button>
            </div>
          </details>
        </div>
      </form>

      <section
        aria-live="polite"
        className="min-w-0 overflow-hidden rounded-md border border-neutral-200 bg-white p-4 shadow-sm sm:p-5"
      >
        <h2 className="text-xl font-semibold text-neutral-950">Resultado</h2>
        {error !== null ? <ErrorPanel error={error} /> : null}
        {authorities !== null ? <AuthoritiesResult authorities={authorities} /> : null}
        {batch !== null ? <BatchDiagnostics batch={batch} /> : null}
        {commit !== null ? <CommitResult commit={commit} /> : null}
        {commitPlan !== null ? <CommitPlanResult commitPlan={commitPlan} /> : null}
        {dryRun !== null ? <DryRunResult dryRun={dryRun} /> : null}
        {history !== null ? <HistoryResult history={history} /> : null}
        {preview !== null ? <MappingPreview preview={preview} /> : null}
        {rollback !== null ? <RollbackResult rollback={rollback} /> : null}
        {rollbackPlan !== null ? <RollbackPlanResult rollbackPlan={rollbackPlan} /> : null}
        {error === null &&
        authorities === null &&
        batch === null &&
        commit === null &&
        commitPlan === null &&
        dryRun === null &&
        history === null &&
        preview === null &&
        rollback === null &&
        rollbackPlan === null ? (
          <p className="mt-3 text-sm leading-6 text-neutral-700">
            Ejecute un diagnóstico para ver el estado del lote, errores de planilla y campos
            pendientes antes de cualquier mapeo.
          </p>
        ) : null}
      </section>
    </div>
  );
}

function WorkflowBatches({
  onSelect,
  workflow,
}: {
  readonly onSelect: (sourcePath: string) => void;
  readonly workflow: PublicationImportWorkflowListDto | null;
}) {
  if (workflow === null) {
    return (
      <p className="mt-3 text-sm leading-6 text-neutral-700">
        Actualice para ver los lotes registrados de esta editorial.
      </p>
    );
  }

  if (workflow.batches.length === 0) {
    return <p className="mt-3 text-sm leading-6 text-neutral-700">No hay lotes registrados.</p>;
  }

  return (
    <div className="mt-3 grid gap-3">
      <dl className="grid gap-2 sm:grid-cols-3">
        <Metric label="Total" value={workflow.summary.total} />
        <Metric label="Revisión" value={workflow.summary.readyForReview} />
        <Metric label="Importados" value={workflow.summary.imported} />
      </dl>
      <ul className="grid gap-2">
        {workflow.batches.slice(0, 6).map((batch) => (
          <li
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm"
            key={batch.relativeSourcePath}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-semibold text-neutral-950">{batch.batchLabel}</p>
                <p className="mt-1 break-words text-xs leading-5 text-neutral-600">
                  {batch.relativeSourcePath}
                </p>
              </div>
              <span className={workflowStatusClassName(batch.status)}>
                {formatWorkflowStatus(batch.status)}
              </span>
            </div>
            <button
              className="mt-2 text-sm font-semibold text-blue-900 hover:text-blue-950"
              onClick={() => {
                onSelect(batch.relativeSourcePath);
              }}
              type="button"
            >
              Usar este lote
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WorkflowBatchDetail({
  detail,
}: {
  readonly detail: PublicationImportWorkflowBatchDetailDto | null;
}) {
  if (detail === null) {
    return null;
  }

  return (
    <section className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-neutral-950">Historial del lote</h4>
          <p className="mt-1 break-words text-xs leading-5 text-neutral-600">
            {detail.batch.relativeSourcePath}
          </p>
        </div>
        <span className={workflowStatusClassName(detail.batch.status)}>
          {formatWorkflowStatus(detail.batch.status)}
        </span>
      </div>
      <ol className="mt-3 grid gap-2">
        {detail.events.map((event) => (
          <li className="rounded-md bg-white px-3 py-2 text-sm" key={`${event.at}-${event.status}`}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-neutral-950">
                {formatWorkflowStatus(event.status)}
              </span>
              <time className="text-xs text-neutral-600">{event.at}</time>
            </div>
            <p className="mt-1 leading-6 text-neutral-700">{event.message}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ReviewQueue({
  onApprove,
  onReject,
  onSelect,
  reviewQueue,
}: {
  readonly onApprove: (sourcePath: string) => void;
  readonly onReject: (sourcePath: string) => void;
  readonly onSelect: (sourcePath: string) => void;
  readonly reviewQueue: PublicationImportWorkflowListDto | null;
}) {
  if (reviewQueue === null) {
    return (
      <p className="mt-3 text-sm leading-6 text-neutral-700">
        Cargue la cola para ver lotes enviados por editoriales.
      </p>
    );
  }

  if (reviewQueue.batches.length === 0) {
    return (
      <p className="mt-3 text-sm leading-6 text-neutral-700">
        No hay lotes pendientes de revisión nacional.
      </p>
    );
  }

  return (
    <div className="mt-3 grid gap-3">
      <dl className="grid gap-2 sm:grid-cols-3">
        <Metric label="Pendientes" value={reviewQueue.summary.readyForReview} />
        <Metric label="Editoriales" value={countDistinctPublishers(reviewQueue)} />
        <Metric label="Total" value={reviewQueue.summary.total} />
      </dl>
      <ul className="grid gap-2">
        {reviewQueue.batches.slice(0, 8).map((batch) => (
          <li
            className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm"
            key={batch.relativeSourcePath}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="break-words font-semibold text-neutral-950">{batch.publisherId}</p>
                <p className="mt-1 break-words text-neutral-700">{batch.batchLabel}</p>
                <p className="mt-1 break-words text-xs leading-5 text-neutral-600">
                  {batch.relativeSourcePath}
                </p>
              </div>
              <span className={workflowStatusClassName(batch.status)}>
                {formatWorkflowStatus(batch.status)}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <button
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-blue-800 bg-white px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-blue-50"
                onClick={() => {
                  onSelect(batch.relativeSourcePath);
                }}
                type="button"
              >
                Seleccionar
              </button>
              <button
                className="inline-flex min-h-9 items-center justify-center rounded-md bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-950"
                onClick={() => {
                  onSelect(batch.relativeSourcePath);
                  onApprove(batch.relativeSourcePath);
                }}
                type="button"
              >
                Aprobar
              </button>
              <button
                className="inline-flex min-h-9 items-center justify-center rounded-md bg-red-900 px-3 py-2 text-sm font-semibold text-white hover:bg-red-950"
                onClick={() => {
                  onSelect(batch.relativeSourcePath);
                  onReject(batch.relativeSourcePath);
                }}
                type="button"
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HistoryResult({ history }: { readonly history: PublicationImportAuditLogDto }) {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-neutral-700">
        Historial operativo de commits registrados por la plataforma.
      </p>
      <dl className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Lotes" value={history.summary.entries} />
        <Metric label="Items Omeka" value={history.summary.createdItems} />
        <Metric label="Media Omeka" value={history.summary.createdMedia} />
      </dl>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Commits registrados</h3>
        {history.entries.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-700">No hay commits registrados.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {history.entries.slice(0, 20).map((entry) => (
              <li className="rounded-md bg-white px-3 py-3 text-sm text-neutral-700" key={entry.id}>
                <p>
                  <span className="font-semibold text-neutral-950">{entry.committedAt}</span>{" "}
                  {entry.source} / {entry.sheet}
                </p>
                <p className="mt-1">
                  Auditoria {entry.id}. Items {entry.summary.createdItems}, media{" "}
                  {entry.summary.createdMedia}.
                </p>
                <p className="mt-1 text-xs text-neutral-600">
                  {entry.created
                    .map(
                      (resource) =>
                        `fila ${String(resource.row)}: item ${String(resource.omekaItemId)}`,
                    )
                    .join("; ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RollbackPlanResult({
  rollbackPlan,
}: {
  readonly rollbackPlan: PublicationImportRollbackPlanDto;
}) {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-neutral-700">
        Plan no destructivo de rollback. No se eliminó ningún recurso en Omeka S.
      </p>
      <dl className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric
          label="Estado"
          value={rollbackPlan.status === "planned_not_executed" ? "planificado" : "bloqueado"}
        />
        <Metric label="Items" value={rollbackPlan.summary.items} />
        <Metric label="Operaciones" value={rollbackPlan.summary.operations} />
        <Metric label="Riesgos" value={rollbackPlan.summary.risks} />
      </dl>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Riesgos</h3>
        {rollbackPlan.risks.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-700">Sin riesgos bloqueantes.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rollbackPlan.risks.map((risk) => (
              <li
                className="rounded-md bg-white px-3 py-2 text-sm text-neutral-800"
                key={`${risk.code}-${String(risk.omekaId)}`}
              >
                <span className="font-semibold text-neutral-950">{risk.code}: </span>
                item/media {risk.omekaId}. {risk.message}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Operaciones proyectadas</h3>
        {rollbackPlan.operations.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-700">Sin operaciones ejecutables.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {rollbackPlan.operations.map((operation) => (
              <li
                className="rounded-md bg-white px-3 py-2 text-sm text-neutral-800"
                key={`${operation.type}-${String(operation.omekaId)}`}
              >
                <span className="font-semibold text-neutral-950">{operation.type}: </span>
                {operation.target} {operation.omekaId}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RollbackResult({ rollback }: { readonly rollback: PublicationImportRollbackDto }) {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-neutral-700">
        Rollback ejecutado en Omeka S. El resultado quedó registrado en auditoria local.
      </p>
      <dl className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Items eliminados" value={rollback.summary.deletedItems} />
        <Metric label="Media eliminada" value={rollback.summary.deletedMedia} />
        <Metric label="Audit ID" value={rollback.auditId} />
      </dl>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Recursos eliminados</h3>
        <ul className="mt-3 space-y-2">
          {rollback.deleted.map((resource) => (
            <li
              className="rounded-md bg-white px-3 py-2 text-sm text-neutral-800"
              key={`${resource.type}-${String(resource.omekaId)}`}
            >
              <span className="font-semibold text-neutral-950">{resource.type}: </span>
              {resource.omekaId}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AuthoritiesResult({
  authorities,
}: {
  readonly authorities: PublicationImportAuthoritiesDto;
}) {
  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-neutral-700">
          Autoridades disponibles en el catálogo activo para completar la plantilla de
          enriquecimiento.
        </p>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-blue-800 px-4 text-sm font-semibold text-blue-900 hover:bg-blue-50"
          onClick={() => {
            exportAuthoritiesCsv(authorities);
          }}
          type="button"
        >
          Exportar autoridades
        </button>
      </div>
      <dl className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Editoriales" value={authorities.summary.publishers} />
        <Metric label="Contribuyentes" value={authorities.summary.contributors} />
        <Metric label="Materias" value={authorities.summary.subjects} />
      </dl>
      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <AuthorityList
          items={authorities.publishers.map((publisher) => ({
            id: publisher.id,
            label: publisher.acronym
              ? `${publisher.label} (${publisher.acronym})`
              : publisher.label,
          }))}
          title="Editoriales"
        />
        <AuthorityList
          items={authorities.contributors.map((contributor) => ({
            id: contributor.id,
            label:
              contributor.roles.length === 0
                ? contributor.label
                : `${contributor.label} | ${contributor.roles.join("|")}`,
          }))}
          title="Contribuyentes"
        />
        <AuthorityList
          items={authorities.subjects.map((subject) => ({
            id: subject.id,
            label: subject.label,
          }))}
          title="Materias"
        />
      </div>
    </div>
  );
}

function CommitResult({ commit }: { readonly commit: PublicationImportCommitDto }) {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-neutral-700">
        Escritura completada en Omeka S. Refresque el catálogo para ver los registros publicados.
      </p>
      <dl className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label="Candidatos" value={commit.summary.candidates} />
        <Metric label="Items Omeka" value={commit.summary.createdItems} />
        <Metric label="Media Omeka" value={commit.summary.createdMedia} />
      </dl>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Recursos creados</h3>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          {commit.created.map((resource) => (
            <li className="rounded-md bg-white px-3 py-2" key={resource.pnpuUuid}>
              <span className="font-semibold text-neutral-950">Fila {resource.row}: </span>
              item {resource.omekaItemId}
              {resource.omekaMediaId === undefined
                ? ""
                : `, media ${String(resource.omekaMediaId)}`}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function AuthorityList({
  items,
  title,
}: {
  readonly items: readonly {
    readonly id: string;
    readonly label: string;
  }[];
  readonly title: string;
}) {
  return (
    <section className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
      <h3 className="text-base font-semibold text-neutral-950">{title}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-700">Sin autoridades.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          {items.slice(0, 12).map((item) => (
            <li className="rounded-md bg-white px-3 py-2" key={`${title}-${item.id}`}>
              <span className="font-semibold text-neutral-950">{item.id}: </span>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function CommitPlanResult({ commitPlan }: { readonly commitPlan: PublicationImportCommitPlanDto }) {
  return (
    <div className="mt-5">
      <p className="text-sm leading-6 text-neutral-700">
        Plan operativo generado. No se escribió en Omeka S ni PostgreSQL.
      </p>
      <dl className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Estado" value={formatCommitPlanStatus(commitPlan.status)} />
        <Metric label="Candidatos" value={commitPlan.summary.candidates} />
        <Metric label="Operaciones" value={commitPlan.summary.operations} />
        <Metric label="Riesgos" value={commitPlan.summary.risks} />
      </dl>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Riesgos bloqueantes</h3>
        {commitPlan.risks.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-700">Sin riesgos detectados en el paquete.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {commitPlan.risks.slice(0, 12).map((risk) => (
              <li
                className="rounded-md bg-white px-3 py-2 text-sm text-neutral-800"
                key={`${risk.code}-${String(risk.row ?? 0)}-${risk.message}`}
              >
                <span className="font-semibold text-neutral-950">{risk.code}: </span>
                {risk.row === undefined ? "" : `Fila ${String(risk.row)}. `}
                {risk.message}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Operaciones proyectadas</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-600">
                <th className="py-2 pr-4 font-semibold">Fila</th>
                <th className="py-2 pr-4 font-semibold">Operación</th>
                <th className="py-2 pr-4 font-semibold">Destino</th>
                <th className="py-2 pr-4 font-semibold">Datos</th>
              </tr>
            </thead>
            <tbody>
              {commitPlan.operations.slice(0, 30).map((operation, index) => (
                <tr className="border-b border-neutral-100 align-top last:border-0" key={index}>
                  <td className="py-2 pr-4 font-semibold text-neutral-950">
                    {operation.row ?? "lote"}
                  </td>
                  <td className="py-2 pr-4 text-neutral-800">{operation.type}</td>
                  <td className="py-2 pr-4 text-neutral-700">{operation.target}</td>
                  <td className="py-2 pr-4 text-neutral-700">
                    {formatOperationPayload(operation.payload)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DryRunResult({ dryRun }: { readonly dryRun: PublicationImportDryRunDto }) {
  const readyCandidates = dryRun.candidates.filter((candidate) => candidate.decision === "ready");

  return (
    <div className="mt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-neutral-700">
          Validación en seco del CSV enriquecido. No se escribió en Omeka S ni PostgreSQL.
        </p>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-blue-800 px-4 text-sm font-semibold text-blue-900 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-neutral-300 disabled:text-neutral-400"
          disabled={readyCandidates.length === 0}
          onClick={() => {
            exportReadyImportPackage(dryRun);
          }}
          type="button"
        >
          Exportar candidatos
        </button>
      </div>
      <dl className="mt-5 grid gap-3 md:grid-cols-4">
        <Metric label="Filas" value={dryRun.summary.totalRows} />
        <Metric label="Listas" value={dryRun.summary.ready} />
        <Metric label="Incompletas" value={dryRun.summary.incomplete} />
        <Metric label="Rechazadas" value={dryRun.summary.rejected} />
      </dl>
      <section className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4">
        <h3 className="text-base font-semibold text-neutral-950">Candidatos evaluados</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-600">
                <th className="py-2 pr-4 font-semibold">Fila</th>
                <th className="py-2 pr-4 font-semibold">Estado</th>
                <th className="py-2 pr-4 font-semibold">Título</th>
                <th className="py-2 pr-4 font-semibold">Idioma</th>
                <th className="py-2 pr-4 font-semibold">Causa</th>
              </tr>
            </thead>
            <tbody>
              {dryRun.candidates.slice(0, 25).map((candidate) => (
                <tr
                  className="border-b border-neutral-100 align-top last:border-0"
                  key={candidate.row}
                >
                  <td className="py-2 pr-4 font-semibold text-neutral-950">{candidate.row}</td>
                  <td className="py-2 pr-4">
                    <span className={dryRunDecisionClassName(candidate.decision)}>
                      {formatDryRunDecision(candidate.decision)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-neutral-800">{candidate.title || "sin título"}</td>
                  <td className="py-2 pr-4 text-neutral-700">
                    {candidate.language || "pendiente"}
                  </td>
                  <td className="py-2 pr-4 text-neutral-700">{candidate.reasons.join(" ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            className="inline-flex h-10 items-center justify-center rounded-md border border-blue-800 px-4 text-sm font-semibold text-blue-900 hover:bg-blue-50"
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

  return `${baseClassName} bg-blue-50 text-blue-900`;
}

function formatWorkflowStatus(
  status: PublicationImportWorkflowListDto["batches"][number]["status"],
): string {
  if (status === "diagnosed") {
    return "diagnosticado";
  }

  if (status === "dry_run_completed") {
    return "dry-run";
  }

  if (status === "imported") {
    return "importado";
  }

  if (status === "needs_correction") {
    return "corregir";
  }

  if (status === "previewed") {
    return "preview";
  }

  if (status === "ready_for_review") {
    return "en revisión";
  }

  if (status === "approved") {
    return "aprobado";
  }

  if (status === "rejected") {
    return "rechazado";
  }

  return "cargado";
}

function workflowStatusClassName(
  status: PublicationImportWorkflowListDto["batches"][number]["status"],
): string {
  const baseClassName =
    "inline-flex shrink-0 items-center rounded-md px-2 py-1 text-xs font-semibold";

  if (status === "imported" || status === "ready_for_review" || status === "approved") {
    return `${baseClassName} bg-blue-50 text-blue-900`;
  }

  if (status === "needs_correction" || status === "rejected") {
    return `${baseClassName} bg-red-50 text-red-800`;
  }

  return `${baseClassName} bg-neutral-100 text-neutral-700`;
}

function countDistinctPublishers(workflow: PublicationImportWorkflowListDto): number {
  return new Set(workflow.batches.map((batch) => batch.publisherId)).size;
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

  return `${baseClassName} bg-blue-50 text-blue-900`;
}

type PublicationImportAction =
  | "authorities"
  | "commit"
  | "commitPlan"
  | "diagnose"
  | "dryRun"
  | "history"
  | "preview"
  | "rollback"
  | "rollbackPlan";

function readSubmitAction(event: SyntheticEvent<HTMLFormElement>): PublicationImportAction {
  const nativeEvent = event.nativeEvent as SubmitEvent;
  const submitter = nativeEvent.submitter;

  if (submitter instanceof HTMLButtonElement && submitter.value === "authorities") {
    return "authorities";
  }

  if (submitter instanceof HTMLButtonElement && submitter.value === "commit") {
    return "commit";
  }

  if (submitter instanceof HTMLButtonElement && submitter.value === "commitPlan") {
    return "commitPlan";
  }

  if (submitter instanceof HTMLButtonElement && submitter.value === "dryRun") {
    return "dryRun";
  }

  if (submitter instanceof HTMLButtonElement && submitter.value === "history") {
    return "history";
  }

  if (submitter instanceof HTMLButtonElement && submitter.value === "preview") {
    return "preview";
  }

  if (submitter instanceof HTMLButtonElement && submitter.value === "rollbackPlan") {
    return "rollbackPlan";
  }

  if (submitter instanceof HTMLButtonElement && submitter.value === "rollback") {
    return "rollback";
  }

  return "diagnose";
}

function endpointForAction(action: PublicationImportAction): string {
  if (action === "authorities") {
    return "/api/admin/publication-imports/authorities";
  }

  if (action === "commit") {
    return "/api/admin/publication-imports/commit";
  }

  if (action === "commitPlan") {
    return "/api/admin/publication-imports/commit-plan";
  }

  if (action === "dryRun") {
    return "/api/admin/publication-imports/dry-run";
  }

  if (action === "history") {
    return "/api/admin/publication-imports/history";
  }

  if (action === "rollbackPlan") {
    return "/api/admin/publication-imports/rollback-plan";
  }

  if (action === "rollback") {
    return "/api/admin/publication-imports/rollback";
  }

  return action === "preview"
    ? "/api/admin/publication-imports/mapping-preview"
    : "/api/admin/publication-imports/diagnose";
}

function formatDryRunDecision(
  decision: PublicationImportDryRunDto["candidates"][number]["decision"],
): string {
  if (decision === "ready") {
    return "lista";
  }

  if (decision === "incomplete") {
    return "incompleta";
  }

  return "rechazada";
}

function dryRunDecisionClassName(
  decision: PublicationImportDryRunDto["candidates"][number]["decision"],
): string {
  const baseClassName = "rounded-md px-2 py-1 text-xs font-semibold";

  if (decision === "ready") {
    return `${baseClassName} bg-blue-50 text-blue-900`;
  }

  if (decision === "incomplete") {
    return `${baseClassName} bg-amber-50 text-amber-900`;
  }

  return `${baseClassName} bg-red-50 text-red-800`;
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
    "pnpuUuid",
    "title",
    "isbn",
    "doi",
    "publicationDate",
    "publisher",
    "primaryContributor",
    "contributorAuthorityIds",
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
    "",
    row.title,
    row.normalizedIsbn,
    "",
    formatTemplatePublicationDate(row.normalizedPublicationDate),
    row.publisher,
    row.primaryContributor,
    "",
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

function exportReadyImportPackage(dryRun: PublicationImportDryRunDto): void {
  const readyCandidates = dryRun.candidates.filter((candidate) => candidate.decision === "ready");
  const payload = {
    manifest: {
      generatedAt: new Date().toISOString(),
      source: dryRun.source,
      sheet: dryRun.sheet,
      status: "validated_not_imported",
      warning: "Este paquete no ha sido importado en Omeka S ni PostgreSQL.",
      counts: {
        totalRows: dryRun.summary.totalRows,
        ready: dryRun.summary.ready,
        incomplete: dryRun.summary.incomplete,
        rejected: dryRun.summary.rejected,
        enrichmentRows: dryRun.summary.enrichmentRows,
        exportedCandidates: readyCandidates.length,
      },
    },
    candidates: readyCandidates,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = buildReadyPackageFileName(dryRun);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportAuthoritiesCsv(authorities: PublicationImportAuthoritiesDto): void {
  const rows = [
    ["kind", "id", "label", "extra"],
    ...authorities.publishers.map((publisher) => [
      "publisher",
      publisher.id,
      publisher.label,
      publisher.acronym ?? "",
    ]),
    ...authorities.contributors.map((contributor) => [
      "contributor",
      contributor.id,
      contributor.label,
      contributor.roles.join("|"),
    ]),
    ...authorities.subjects.map((subject) => [
      "subject",
      subject.id,
      subject.label,
      subject.uri ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pnpu-autoridades-importacion-${authorities.generatedAt.replace(/[:.]/gu, "-")}.csv`;
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

function formatTemplatePublicationDate(value: string | null): string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
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

function buildReadyPackageFileName(dryRun: PublicationImportDryRunDto): string {
  const source =
    dryRun.source
      .split(/[\\/]/u)
      .at(-1)
      ?.replace(/\.xlsx$/iu, "") ?? "lote";
  const timestamp = dryRun.generatedAt.replace(/[:.]/gu, "-");

  return `pnpu-candidatos-importacion-${source}-${timestamp}.json`;
}

function formatCommitPlanStatus(status: PublicationImportCommitPlanDto["status"]): string {
  return status === "planned_not_executed" ? "planificado" : "bloqueado";
}

function formatOperationPayload(
  payload: Readonly<Record<string, string | readonly string[]>>,
): string {
  return Object.entries(payload)
    .map(([key, value]) => {
      const formattedValue = typeof value === "string" ? value : value.join("|");

      return `${key}: ${formattedValue}`;
    })
    .join("; ");
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

function readDryRunApiResponse(payload: unknown): PublicationImportDryRunApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportDryRunApiResponse;
  }

  throw new Error("Invalid publication import dry-run response.");
}

function readCommitPlanApiResponse(payload: unknown): PublicationImportCommitPlanApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportCommitPlanApiResponse;
  }

  throw new Error("Invalid publication import commit-plan response.");
}

function readCommitApiResponse(payload: unknown): PublicationImportCommitApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportCommitApiResponse;
  }

  throw new Error("Invalid publication import commit response.");
}

function readHistoryApiResponse(payload: unknown): PublicationImportHistoryApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportHistoryApiResponse;
  }

  throw new Error("Invalid publication import history response.");
}

function readRollbackPlanApiResponse(payload: unknown): PublicationImportRollbackPlanApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportRollbackPlanApiResponse;
  }

  throw new Error("Invalid publication import rollback-plan response.");
}

function readRollbackApiResponse(payload: unknown): PublicationImportRollbackApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportRollbackApiResponse;
  }

  throw new Error("Invalid publication import rollback response.");
}

function readAuthoritiesApiResponse(payload: unknown): PublicationImportAuthoritiesApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportAuthoritiesApiResponse;
  }

  throw new Error("Invalid publication import authorities response.");
}

function readUploadApiResponse(payload: unknown): PublicationImportUploadApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportUploadApiResponse;
  }

  throw new Error("Invalid publication import upload response.");
}

function readWorkflowListApiResponse(payload: unknown): PublicationImportWorkflowListApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportWorkflowListApiResponse;
  }

  throw new Error("Invalid publication import workflow list response.");
}

function readWorkflowDetailApiResponse(
  payload: unknown,
): PublicationImportWorkflowDetailApiResponse {
  if (typeof payload === "object" && payload !== null && "data" in payload && "meta" in payload) {
    return payload as PublicationImportWorkflowDetailApiResponse;
  }

  throw new Error("Invalid publication import workflow detail response.");
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
