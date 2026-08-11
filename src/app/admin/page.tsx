import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "../page-hero";

export const metadata: Metadata = {
  title: "Administración | PNPU",
  description: "Panel administrativo de la Plataforma Nacional de Publicaciones Universitarias.",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[#eef3f8]">
      <PageHero
        description="Acceso a herramientas administrativas protegidas por Keycloak, roles institucionales y doble factor de autenticación."
        eyebrow="Administración"
        title="Panel operativo PNPU"
      />

      <section
        className="mx-auto grid max-w-6xl gap-4 px-6 py-8 md:grid-cols-3"
        aria-label="Herramientas administrativas"
      >
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
