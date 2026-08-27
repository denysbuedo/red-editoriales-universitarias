import Link from "next/link";

const adminNavigationItems = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/importaciones/publicaciones", label: "Importaciones" },
  { href: "/admin/catalogo", label: "Diagnóstico catálogo" },
  { href: "/estado", label: "Estado público" },
];

export function AdminSectionNav() {
  return (
    <nav aria-label="Navegación administrativa" className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
      <div className="flex gap-2 overflow-x-auto rounded-md border border-slate-200 bg-white p-2 shadow-sm">
        {adminNavigationItems.map((item) => (
          <Link
            className="inline-flex h-10 shrink-0 items-center rounded-md px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-950"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
