import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "PNPU",
  description: "Plataforma Nacional de Publicaciones Universitarias.",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es-CU">
      <body>{children}</body>
    </html>
  );
}
