import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Administración | PNPU",
  description: "Panel administrativo de la Plataforma Nacional de Publicaciones Universitarias.",
};

export default function AdminPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-blue-900">
          Administración
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">Panel operativo PNPU</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          Acceso a herramientas administrativas protegidas por Keycloak, roles institucionales y
          doble factor de autenticación.
        </p>
      </header>

      <section className="grid gap-4 py-8 md:grid-cols-3" aria-label="Herramientas administrativas">
        <AdminToolCard
          description="Diagnóstico, previsualización, escritura controlada en Omeka S y rollback de cargas editoriales."
          href="/admin/importaciones/publicaciones"
          title="Importaciones de publicaciones"
        />
        <AdminToolCard
          description="Estado operativo del catálogo, disponibilidad de Omeka S, snapshot y validación del perfil PNPU."
          href="/estado"
          title="Estado del catálogo"
        />
        <AdminToolCard
          description="Contrato REST público y operativo para integraciones institucionales."
          href="/openapi.yaml"
          title="OpenAPI"
        />
      </section>
    </main>
  );
}

function AdminToolCard({
  description,
  href,
  title,
}: {
  readonly description: string;
  readonly href: string;
  readonly title: string;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">{description}</p>
      <Link
        className="mt-5 inline-flex h-10 items-center rounded-md bg-blue-950 px-4 text-sm font-semibold text-white hover:bg-blue-900"
        href={href}
      >
        Abrir
      </Link>
    </article>
  );
}
