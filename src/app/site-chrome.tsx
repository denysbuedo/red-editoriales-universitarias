import Link from "next/link";
import type { ReactNode } from "react";

const navigationItems = [
  { href: "/", label: "Inicio" },
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/editoriales", label: "Editoriales" },
  { href: "/colecciones", label: "Colecciones" },
  { href: "/autores", label: "Autores" },
  { href: "/materias", label: "Materias" },
  { href: "/estado", label: "Estado" },
  { href: "/acerca", label: "Acerca de" },
];

export function SiteShell({ children }: { readonly children: ReactNode }) {
  return (
    <body className="min-h-screen bg-slate-50 text-neutral-950">
      <SiteHeader />
      {children}
      <SiteFooter />
    </body>
  );
}

function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <Link className="group inline-flex flex-col" href="/">
          <span className="text-xs font-semibold uppercase tracking-normal text-blue-900">
            Ministerio de Educación Superior
          </span>
          <span className="text-lg font-bold text-slate-950 group-hover:text-blue-900">PNPU</span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2" aria-label="Navegación principal">
          {navigationItems.map((item) => (
            <Link
              className="rounded-md px-2.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="rounded-md bg-blue-950 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-900"
            href="/admin"
          >
            Administración
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-200">PNPU</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            Esta plataforma está soportada por la Red Nacional de Investigación y Educación de
            Avanzada (Reduniv) del Ministerio de Educación Superior de la República de Cuba.
          </p>
        </div>
        <div className="text-sm text-slate-300">
          <p className="font-semibold text-white">Enlaces operativos</p>
          <div className="mt-3 grid gap-2">
            <Link className="hover:text-blue-200" href="/estado">
              Estado del catálogo
            </Link>
            <Link className="hover:text-blue-200" href="/openapi.yaml">
              OpenAPI
            </Link>
            <Link className="hover:text-blue-200" href="/admin">
              Administración
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
