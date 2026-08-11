import Link from "next/link";

import type { PublicationImportAdminSessionSummary } from "@/modules/publication-import/interfaces/http/publication-import-admin-session";

export function AdminSessionMenu({
  session,
  variant = "panel",
}: {
  readonly session: PublicationImportAdminSessionSummary | null;
  readonly variant?: "header" | "panel";
}) {
  const displayName = session?.displayName ?? "Usuario autenticado";
  const compact = variant === "header";

  return (
    <details className="relative min-w-0">
      <summary
        className={`flex max-w-44 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 shadow-sm hover:border-blue-800 sm:max-w-56 ${
          compact ? "min-h-10 px-2 py-1.5 sm:px-2.5" : "min-h-10 px-3 py-2"
        }`}
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-950 text-xs font-bold uppercase text-white"
          aria-hidden="true"
        >
          {readInitials(displayName)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold">{displayName}</span>
          {compact ? null : <span className="block text-xs text-slate-600">Sesión activa</span>}
        </span>
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-md border border-slate-200 bg-white p-4 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-normal text-blue-900">
          Perfil administrativo
        </p>
        <p className="mt-2 truncate text-sm font-semibold text-slate-950">{displayName}</p>
        {session?.email ? (
          <p className="mt-1 truncate text-sm text-slate-600">{session.email}</p>
        ) : null}
        <div className="mt-4 border-t border-slate-200 pt-3">
          <Link
            className="inline-flex h-9 w-full items-center justify-center rounded-md bg-blue-950 px-3 text-sm font-semibold text-white hover:bg-blue-900"
            href="/api/admin/auth/logout"
          >
            Cerrar sesión
          </Link>
        </div>
      </div>
    </details>
  );
}

function readInitials(value: string): string {
  const parts = value
    .split(/\s+/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}
