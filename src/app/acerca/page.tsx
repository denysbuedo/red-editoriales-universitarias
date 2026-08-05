import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Acerca de PNPU",
  description: "Alcance institucional de la Plataforma Nacional de Publicaciones Universitarias.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <header className="border-b border-slate-200 pb-8">
        <p className="text-sm font-semibold uppercase tracking-normal text-blue-900">
          Plataforma nacional
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">Acerca de PNPU</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">
          La Plataforma Nacional de Publicaciones Universitarias integra información editorial de
          universidades cubanas para facilitar descubrimiento, consulta pública y operación
          coordinada de la Red Nacional de Editoriales Universitarias.
        </p>
      </header>

      <section className="grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid gap-4">
          <InfoSection title="Qué integra">
            <p>
              Publicaciones editoriales universitarias, editoriales, colecciones, autores, materias,
              recursos digitales y metadatos normalizados expuestos mediante catálogo web y API
              REST.
            </p>
          </InfoSection>
          <InfoSection title="Qué no es">
            <p>
              PNPU no es un CMS, no es un LMS, no es una tienda en línea y no sustituye repositorios
              institucionales. Su función es integrar y publicar información editorial universitaria
              con una arquitectura nacional mantenible.
            </p>
          </InfoSection>
          <InfoSection title="Base tecnológica">
            <p>
              El catálogo se apoya en Omeka S para metadatos y en Keycloak para autenticación
              institucional. La plataforma pública se implementa con Next.js, TypeScript, REST y
              OpenAPI.
            </p>
          </InfoSection>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Accesos</h2>
          <div className="mt-4 grid gap-2">
            <QuickLink href="/publicaciones">Catálogo</QuickLink>
            <QuickLink href="/editoriales">Editoriales</QuickLink>
            <QuickLink href="/estado">Estado operativo</QuickLink>
            <QuickLink href="/openapi.yaml">OpenAPI</QuickLink>
            <QuickLink href="/admin">Administración</QuickLink>
          </div>
        </aside>
      </section>
    </main>
  );
}

function InfoSection({
  children,
  title,
}: {
  readonly children: ReactNode;
  readonly title: string;
}) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-3 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

function QuickLink({ children, href }: { readonly children: string; readonly href: string }) {
  return (
    <Link
      className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-blue-900 hover:bg-slate-50"
      href={href}
    >
      {children}
    </Link>
  );
}
