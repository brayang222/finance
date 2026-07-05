import "./globals.css";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Finance",
  description: "Control de finanzas personales",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const theme = (await cookies()).get("gfp-theme")?.value;
  return (
    <html lang="es" suppressHydrationWarning data-theme={theme || undefined}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Spectral:wght@300;400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
