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
  title: "Catálogo EDUNIV",
  description: "Catálogo de la Red de Editoriales Universitarias Cubanas.",
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
