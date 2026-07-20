import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";
import CalcInteres from "./CalcInteres";

export const metadata: Metadata = {
  title: "Calculadora de interés compuesto en pesos colombianos",
  description:
    "Simula cuánto crece tu ahorro con aportes mensuales e interés compuesto: aporte, tasa E.A. y años. Ve cuánto pones tú y cuánto ponen los rendimientos.",
  keywords: ["calculadora interés compuesto", "simulador de ahorro", "cuánto crece mi ahorro", "interés compuesto colombia"],
  alternates: { canonical: `${SITE_URL}/herramientas/calculadora-interes-compuesto` },
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
            name: "Calculadora de interés compuesto",
            url: `${SITE_URL}/herramientas/calculadora-interes-compuesto`,
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
        Calculadora de interés compuesto
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        Aportando un monto fijo cada mes, mira cuánto acumulas — y cuánta parte la ponen los
        rendimientos reinvertidos, no tu bolsillo.
      </p>
      <CalcInteres />
      <div className="post-body mt-10">
        <h2>Cómo leer el resultado</h2>
        <p>El cálculo convierte la tasa E.A. a mensual y capitaliza cada aporte: <strong>los intereses generan intereses</strong>. Al principio casi todo lo pone tu bolsillo; con los años, los rendimientos superan tus aportes. Por eso el tiempo es la palanca más poderosa del ahorro.</p>
        <p>La teoría completa, con la tabla de $200.000 mensuales a 10, 20 y 30 años:{" "}
        <Link href="/blog/que-es-el-interes-compuesto-y-como-usarlo-a-tu-favor" style={{ color: "var(--fg)" }}>¿Qué es el interés compuesto y cómo usarlo a tu favor?</Link></p>
      </div>
    </>
  );
}
