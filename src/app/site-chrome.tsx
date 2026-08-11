import Link from "next/link";
import type { ReactNode } from "react";

import type { PublicationImportAdminSessionSummary } from "@/modules/publication-import/interfaces/http/publication-import-admin-session";

import { AdminSessionMenu } from "./admin/admin-session-menu";

const navigationItems = [
  { href: "/", label: "Inicio" },
  { href: "/editoriales", label: "Editoriales" },
  { href: "/publicaciones", label: "Publicaciones" },
  { href: "/acerca", label: "Acerca de" },
  { href: "/admin", label: "Administración" },
];

export function SiteShell({
  children,
  session,
}: {
  readonly children: ReactNode;
  readonly session: PublicationImportAdminSessionSummary | null;
}) {
  return (
    <body className="min-h-screen bg-slate-50 text-neutral-950">
      <SiteHeader session={session} />
      {children}
      <SiteFooter />
    </body>
  );
}

function SiteHeader({
  session,
}: {
  readonly session: PublicationImportAdminSessionSummary | null;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link className="group inline-flex min-w-0 flex-col" href="/">
            <span className="text-lg font-bold text-slate-950 group-hover:text-blue-900">PNPU</span>
            <span className="hidden text-xs font-semibold uppercase tracking-normal text-slate-500 sm:block">
              Plataforma nacional
            </span>
          </Link>

          <div className="hidden min-w-0 items-center gap-3 lg:flex">
            <nav className="flex items-center gap-1" aria-label="Navegación principal">
              {navigationItems.map((item) => (
                <HeaderNavLink href={item.href} key={item.href}>
                  {item.label}
                </HeaderNavLink>
              ))}
            </nav>
            {session === null ? null : <AdminSessionMenu session={session} variant="header" />}
          </div>

          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            {session === null ? null : <AdminSessionMenu session={session} variant="header" />}
            <details className="relative">
              <summary className="inline-flex min-h-10 cursor-pointer list-none items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-sm hover:border-blue-800">
                Menú
              </summary>
              <nav
                aria-label="Navegación principal"
                className="absolute right-0 z-40 mt-2 grid w-[min(18rem,calc(100vw-2rem))] gap-1 rounded-md border border-slate-200 bg-white p-2 shadow-lg"
              >
                {navigationItems.map((item) => (
                  <HeaderNavLink href={item.href} key={item.href}>
                    {item.label}
                  </HeaderNavLink>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeaderNavLink({
  children,
  href,
}: {
  readonly children: ReactNode;
  readonly href: string;
}) {
  return (
    <Link
      className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-950"
      href={href}
    >
      {children}
    </Link>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-blue-200">PNPU</p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
            Esta plataforma está soportada por la Red Nacional de Investigación y Educación de
            Avanzada (Reduniv) del Ministerio de Educación Superior de la República de Cuba.
          </p>
        </div>
      </div>
    </footer>
  );
}
