import "./globals.css";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";

const SITE_URL = "https://financials-app.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Finance — Controla tus finanzas personales y las de tu negocio",
    template: "%s | Finance",
  },
  description:
    "App gratuita para registrar gastos, presupuestos, deudas, inversiones y las ventas de tu negocio. Hecha para Colombia: en pesos, con fiado, caja y Bre-B.",
  keywords: [
    "finanzas personales", "control de gastos", "app de finanzas colombia",
    "presupuesto personal", "registro de ventas negocio", "educación financiera",
  ],
  applicationName: "Finance",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Finance",
    locale: "es_CO",
    title: "Finance — Controla tus finanzas personales y las de tu negocio",
    description:
      "Registra gastos, presupuestos, deudas y las ventas de tu negocio en segundos. Gratis y hecha para Colombia.",
    images: [{ url: `${SITE_URL}/og`, width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
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
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Finance",
                url: SITE_URL,
                logo: `${SITE_URL}/icon.png`,
                description: "App de finanzas personales y de negocio para Colombia.",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Finance",
                url: SITE_URL,
                inLanguage: "es-CO",
              },
            ]),
          }}
        />
        {children}
      </body>
    </html>
  );
}
