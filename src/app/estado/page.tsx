import type { Metadata } from "next";
import Link from "next/link";

import {
  buildOmekaCatalogOperationalDiagnostics,
  HttpOmekaApiClient,
  readOmekaCatalogRepositoryCacheSnapshot,
  readOmekaCatalogRepositoryOptions,
  readCatalogRepositoryMode,
  readOmekaConfig,
} from "@/modules/catalog/infrastructure";

export const metadata: Metadata = {
  title: "Estado del catálogo | PNPU",
  description: "Diagnóstico operativo del catálogo PNPU y su integración con Omeka S.",
};

export const dynamic = "force-dynamic";

export default async function CatalogStatusPage() {
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

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <Link className="text-sm font-medium text-green-800 hover:text-green-950" href="/">
        PNPU
      </Link>
      <header className="mt-8 border-b border-neutral-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-green-800">
          Diagnóstico
        </p>
        <h1 className="mt-3 text-3xl font-bold text-neutral-950 md:text-4xl">
          Estado del catálogo
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-700">
          Estado operativo de la fuente de catálogo, plantillas PNPU y recursos reconocidos.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Resumen operativo">
        <MetricCard label="Repositorio" value={mode} />
        <MetricCard
          label="Perfil PNPU"
          value={diagnostics?.installation.readyForPnpuMapping === true ? "listo" : "pendiente"}
        />
        <MetricCard label="Recursos" value={String(diagnostics?.snapshot.totals.resources ?? 0)} />
      </section>

      {diagnostics === null ? (
        <section className="mt-8 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-950">Omeka no configurado</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            Defina `PNPU_OMEKA_BASE_URL` para activar el diagnóstico de integración Omeka S.
          </p>
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-950">Cache Omeka</h2>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <MetricRow label="Habilitado" value={cache?.enabled === true ? "sí" : "no"} />
              <MetricRow label="Disponible" value={cache?.present === true ? "sí" : "no"} />
              <MetricRow label="Vigente" value={cache?.fresh === true ? "sí" : "no"} />
              <MetricRow label="Actualizado" value={cache?.refreshedAt ?? "pendiente"} />
              <MetricRow label="Expira" value={cache?.expiresAt ?? "pendiente"} />
            </dl>
          </section>

          <section className="mt-8 rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-neutral-950">Recursos PNPU reconocidos</h2>
            <dl className="mt-4 grid gap-3 md:grid-cols-4">
              {Object.entries(diagnostics.snapshot.recognizedByKind).map(([kind, count]) => (
                <div key={kind}>
                  <dt className="text-sm font-semibold text-neutral-600">{kind}</dt>
                  <dd className="mt-1 text-2xl font-bold text-neutral-950">{count}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-950">Calidad de mapeo</h2>
              <dl className="mt-4 grid gap-3">
                <MetricRow label="Advertencias" value={diagnostics.snapshot.quality.warnings} />
                <MetricRow label="Rechazos" value={diagnostics.snapshot.quality.rejected} />
                <MetricRow
                  label="Recursos desconocidos"
                  value={diagnostics.snapshot.unknown.total}
                />
                <MetricRow
                  label="Sin plantilla"
                  value={diagnostics.snapshot.unknown.withoutTemplate}
                />
              </dl>
            </div>
            <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-neutral-950">Instalación Omeka</h2>
              <dl className="mt-4 grid gap-3">
                <MetricRow
                  label="Vocabularios faltantes"
                  value={diagnostics.installation.missingVocabularies.length}
                />
                <MetricRow
                  label="Propiedades faltantes"
                  value={diagnostics.installation.missingProperties.length}
                />
                <MetricRow
                  label="Plantillas revisadas"
                  value={diagnostics.installation.templates.length}
                />
              </dl>
            </div>
          </section>
        </>
      )}
    </main>
  );
}

function MetricCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-neutral-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-neutral-950">{value}</p>
    </div>
  );
}

function MetricRow({ label, value }: { readonly label: string; readonly value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-2">
      <dt className="text-sm text-neutral-700">{label}</dt>
      <dd className="text-sm font-semibold text-neutral-950">{value}</dd>
    </div>
  );
}
