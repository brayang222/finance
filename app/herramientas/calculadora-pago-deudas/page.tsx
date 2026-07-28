import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";
import CalcDeuda from "./CalcDeuda";

export const metadata: Metadata = {
  title: "Calculadora de pago de deudas — ¿cuándo terminas de pagar?",
  description:
    "Simula tu deuda: cuánto tardas en pagarla, cuánto pagas de intereses y cuánto te ahorras con un abono extra mensual. En pesos colombianos.",
  keywords: ["calculadora pago de deudas", "cuándo termino de pagar mi deuda", "simulador deuda tarjeta", "abono extra a deuda"],
  alternates: { canonical: `${SITE_URL}/herramientas/calculadora-pago-deudas` },
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
            name: "Calculadora de pago de deudas",
            url: `${SITE_URL}/herramientas/calculadora-pago-deudas`,
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
        ¿Cuándo terminas de pagar tu deuda?
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        Pon tu saldo, tasa y cuota — y mira el efecto real de un abono extra: cuántos meses
        y cuántos pesos de intereses te ahorras.
      </p>
      <CalcDeuda />
      <div className="post-body mt-10">
        <h2>Por qué el abono extra pesa tanto</h2>
        <p>Cada peso extra va <strong>directo al capital</strong>, y el capital que eliminas deja de generar intereses todos los meses siguientes. Es el interés compuesto trabajando a tu favor por fin. En tarjetas de crédito (tasas cercanas a la usura) el efecto es dramático: un abono pequeño puede recortar años.</p>
        <p>El método completo para salir de deudas — bola de nieve, avalancha y compra de cartera:{" "}
        <Link href="/blog/como-salir-de-deudas" style={{ color: "var(--fg)" }}>¿Cómo salir de deudas rápido?</Link></p>
      </div>
    </>
  );
}
