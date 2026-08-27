import type { Metadata } from "next";
import Link from "next/link";

import type { OmekaQualityIssue } from "@/modules/catalog/infrastructure/omeka";
import {
  buildOmekaCatalogOperationalDiagnostics,
  createOmekaCatalogRepositoriesFromApi,
  HttpOmekaApiClient,
  readCatalogRepositoryMode,
  readOmekaCatalogRepositoryCacheSnapshot,
  readOmekaCatalogRepositoryOptions,
  readOmekaConfig,
} from "@/modules/catalog/infrastructure";

import { AdminSectionNav } from "../admin-section-nav";
import { PageHero } from "../../page-hero";

export const metadata: Metadata = {
  title: "Diagnóstico del catálogo | PNPU",
  description: "Diagnóstico administrativo del catálogo PNPU integrado con Omeka S.",
};

export const dynamic = "force-dynamic";

export default async function AdminCatalogPage() {
  const mode = readCatalogRepositoryMode();
  const omekaConfig = readOmekaConfig();
  const diagnostics =
    omekaConfig === null
      ? null
      : await buildOmekaCatalogOperationalDiagnostics(new HttpOmekaApiClient(omekaConfig));
  const cache =
    omekaConfig === null
      ? null
      : readOmekaCatalogRepositoryCacheSnapshot(
          readOmekaCatalogRepositoryOptions(process.env, omekaConfig.baseUrl),
        );
  const activeMapping =
    omekaConfig === null
      ? null
      : await createOmekaCatalogRepositoriesFromApi(
          new HttpOmekaApiClient(omekaConfig),
          readOmekaCatalogRepositoryOptions(process.env, omekaConfig.baseUrl),
        );
  const activeIssues = activeMapping?.catalog.quality.issues.slice(0, 50) ?? [];
  const ready =
    diagnostics?.installation.readyForPnpuMapping === true &&
    diagnostics.snapshot.unknown.total === 0 &&
    diagnostics.snapshot.quality.rejected === 0 &&
    (activeMapping?.catalog.quality.rejectedCount ?? 0) === 0;

  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Vista administrativa para revisar la fuente Omeka, la calidad del mapeo activo y las exportaciones operativas del catálogo."
        eyebrow="Administración"
        title="Diagnóstico del catálogo"
      />
      <AdminSectionNav />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <section className="grid gap-4 md:grid-cols-4" aria-label="Resumen del catálogo">
          <MetricCard
            label="Estado"
            tone={ready ? "ok" : "warn"}
            value={ready ? "listo" : "revisar"}
          />
          <MetricCard label="Repositorio" value={mode} />
          <MetricCard label="Recursos Omeka" value={diagnostics?.snapshot.totals.resources ?? 0} />
          <MetricCard
            label="Publicaciones activas"
            value={activeMapping?.catalog.publications.length ?? 0}
          />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Mapeo activo PNPU</h2>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Registros que la plataforma pudo convertir desde Omeka al modelo de dominio.
                </p>
              </div>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-950 px-4 text-sm font-semibold text-white hover:bg-blue-900"
                href="/api/admin/catalog/zenodo-export"
              >
                Exportar Zenodo
              </Link>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              <MetricRow
                label="Editoriales"
                value={activeMapping?.catalog.publishers.length ?? 0}
              />
              <MetricRow label="Autores" value={activeMapping?.catalog.contributors.length ?? 0} />
              <MetricRow label="Materias" value={activeMapping?.catalog.subjects.length ?? 0} />
              <MetricRow
                label="Colecciones"
                value={activeMapping?.catalog.collections.length ?? 0}
              />
              <MetricRow
                label="Advertencias activas"
                value={activeMapping?.catalog.quality.warningCount ?? 0}
              />
              <MetricRow
                label="Rechazos activos"
                value={activeMapping?.catalog.quality.rejectedCount ?? 0}
              />
            </dl>
          </article>

          <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Cache</h2>
            <dl className="mt-5 grid gap-3">
              <MetricRow label="Habilitado" value={cache?.enabled === true ? "si" : "no"} />
              <MetricRow label="Disponible" value={cache?.present === true ? "si" : "no"} />
              <MetricRow label="Vigente" value={cache?.fresh === true ? "si" : "no"} />
              <MetricRow label="Actualizado" value={cache?.refreshedAt ?? "pendiente"} />
            </dl>
          </article>
        </section>

        <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Incidencias del mapeo activo</h2>
          {activeIssues.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-slate-700">
              No hay advertencias ni rechazos en el mapeo activo del catálogo.
            </p>
          ) : (
            <IssueTable issues={activeIssues} />
          )}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Snapshot Omeka</h2>
            <dl className="mt-5 grid gap-3">
              <MetricRow
                label="Recursos desconocidos"
                value={diagnostics?.snapshot.unknown.total ?? 0}
              />
              <MetricRow
                label="Sin plantilla"
                value={diagnostics?.snapshot.unknown.withoutTemplate ?? 0}
              />
              <MetricRow
                label="Advertencias snapshot"
                value={diagnostics?.snapshot.quality.warnings ?? 0}
              />
              <MetricRow
                label="Rechazos snapshot"
                value={diagnostics?.snapshot.quality.rejected ?? 0}
              />
            </dl>
          </article>

          <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Perfil Omeka</h2>
            <dl className="mt-5 grid gap-3">
              <MetricRow
                label="Perfil PNPU"
                value={
                  diagnostics?.installation.readyForPnpuMapping === true ? "listo" : "pendiente"
                }
              />
              <MetricRow
                label="Vocabularios faltantes"
                value={diagnostics?.installation.missingVocabularies.length ?? 0}
              />
              <MetricRow
                label="Propiedades faltantes"
                value={diagnostics?.installation.missingProperties.length ?? 0}
              />
              <MetricRow
                label="Plantillas revisadas"
                value={diagnostics?.installation.templates.length ?? 0}
              />
            </dl>
          </article>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  tone = "default",
  value,
}: {
  readonly label: string;
  readonly tone?: "default" | "ok" | "warn";
  readonly value: number | string;
}) {
  const toneClass =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-slate-200 bg-white text-slate-950";

  return (
    <div className={`rounded-md border p-5 shadow-sm ${toneClass}`}>
      <p className="text-sm font-semibold opacity-75">{label}</p>
      <p className="mt-2 break-words text-2xl font-bold">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: { readonly label: string; readonly value: number | string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-slate-700">{label}</dt>
      <dd className="break-words text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function IssueTable({ issues }: { readonly issues: readonly OmekaQualityIssue[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="py-2 pr-4 font-semibold">Severidad</th>
            <th className="py-2 pr-4 font-semibold">Omeka ID</th>
            <th className="py-2 pr-4 font-semibold">Plantilla</th>
            <th className="py-2 pr-4 font-semibold">Campo</th>
            <th className="py-2 pr-4 font-semibold">Mensaje</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, index) => (
            <tr
              className="border-b border-slate-100 align-top last:border-0"
              key={`${issue.code}-${String(issue.omekaId ?? "none")}-${issue.field ?? "none"}-${String(index)}`}
            >
              <td className="py-2 pr-4">
                <span
                  className={
                    issue.severity === "rejected"
                      ? "rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-800"
                      : "rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800"
                  }
                >
                  {issue.severity === "rejected" ? "rechazo" : "advertencia"}
                </span>
              </td>
              <td className="py-2 pr-4 text-slate-950">{issue.omekaId ?? "sin id"}</td>
              <td className="py-2 pr-4 text-slate-700">{issue.templateLabel ?? "sin plantilla"}</td>
              <td className="py-2 pr-4 text-slate-700">{issue.field ?? "n/a"}</td>
              <td className="py-2 pr-4 text-slate-700">{issue.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
