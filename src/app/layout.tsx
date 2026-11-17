import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import {
  PUBLICATION_IMPORT_ADMIN_SESSION_COOKIE,
  readPublicationImportAdminSessionSummary,
} from "@/modules/publication-import/interfaces/http/publication-import-admin-session";

import { SiteShell } from "./site-chrome";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CATALOGA | Plataforma Nacional de Publicaciones Universitarias",
    template: "%s | CATALOGA",
  },
  description:
    "Descubre las publicaciones de las universidades cubanas. Un catálogo nacional que integra editoriales, autores y colecciones para ampliar la visibilidad y facilitar el acceso a la producción editorial universitaria.",
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/apple-touch-icon.png",
  },
  openGraph: {
    title: "CATALOGA | Conectamos editoriales. Hacemos circular el conocimiento.",
    description:
      "Descubre las publicaciones de las universidades cubanas. Un catálogo nacional que integra editoriales, autores y colecciones para ampliar la visibilidad y facilitar el acceso a la producción editorial universitaria.",
    locale: "es_CU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CATALOGA | Conectamos editoriales. Hacemos circular el conocimiento.",
    description:
      "Descubre las publicaciones de las universidades cubanas. Un catálogo nacional que integra editoriales, autores y colecciones para ampliar la visibilidad y facilitar el acceso a la producción editorial universitaria.",
  },
};

interface RootLayoutProps {
  children: ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const session = readPublicationImportAdminSessionSummary(
    cookieStore.get(PUBLICATION_IMPORT_ADMIN_SESSION_COOKIE)?.value,
  );

  return (
    <html lang="es-CU">
      <SiteShell session={session}>{children}</SiteShell>
    </html>
  );
}
