import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";
import CalcFecha from "./CalcFecha";

export const metadata: Metadata = {
  title: "¿Cuándo me toca declarar renta en 2026? Consulta por cédula",
  description:
    "Ingresa los últimos 2 dígitos de tu cédula y conoce tu fecha límite exacta del calendario DIAN 2026 (12 de agosto al 26 de octubre).",
  keywords: ["cuándo declarar renta 2026", "fecha declaración renta por cédula", "calendario dian 2026", "plazos renta personas naturales"],
  alternates: { canonical: `${SITE_URL}/herramientas/fecha-declaracion-renta` },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "¿Cuándo me toca declarar renta? — Calendario DIAN 2026",
            url: `${SITE_URL}/herramientas/fecha-declaracion-renta`,
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
            inLanguage: "es-CO",
          }),
        }}
      />
      <nav className="text-xs mt-2 mb-6" style={{ color: "var(--muted)" }}>
        <Link href="/herramientas" className="no-underline" style={{ color: "var(--muted)" }}>← Herramientas</Link>
      </nav>
      <h1 className="font-serif font-light text-3xl md:text-5xl leading-tight mb-3" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
        ¿Cuándo me toca declarar renta?
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        El calendario DIAN 2026 asigna tu fecha según los <strong style={{ color: "var(--fg)" }}>dos últimos dígitos de tu cédula</strong>.
        Los plazos van del 12 de agosto al 26 de octubre de 2026.
      </p>
      <CalcFecha />
      <div className="post-body mt-10">
        <h2>Antes de tu fecha</h2>
        <p>Primero confirma si estás obligado: {" "}
        <Link href="/blog/quienes-deben-declarar-renta-en-2026" style={{ color: "var(--fg)" }}>¿Quién debe declarar renta en 2026?</Link>.
        Luego descarga el reporte de terceros en la página de la DIAN, reúne tus certificados y recuerda: declarar no siempre es pagar — pero presentar tarde siempre cuesta (sanción mínima de $523.740).</p>
      </div>
    </>
  );
}
