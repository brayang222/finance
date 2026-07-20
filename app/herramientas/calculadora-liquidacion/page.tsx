import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";
import { AÑO } from "../valores";
import CalcLiquidacion from "./CalcLiquidacion";

export const metadata: Metadata = {
  title: `Calculadora de liquidación laboral ${AÑO} (Colombia)`,
  description: `Calcula tu liquidación al terminar contrato: cesantías, intereses, prima proporcional y vacaciones. Gratis, con la convención legal de 360 días.`,
  keywords: ["calculadora liquidación", "calcular liquidación laboral", "liquidación contrato trabajo", "cesantías prima vacaciones"],
  alternates: { canonical: `${SITE_URL}/herramientas/calculadora-liquidacion` },
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
            name: `Calculadora de liquidación laboral ${AÑO}`,
            url: `${SITE_URL}/herramientas/calculadora-liquidacion`,
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
        Calculadora de liquidación laboral {AÑO}
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        ¿Terminó tu contrato? Calcula en segundos lo que te deben: cesantías del año en curso,
        intereses, prima proporcional del semestre y vacaciones no disfrutadas.
      </p>
      <CalcLiquidacion />
      <div className="post-body mt-10">
        <h2>¿Qué incluye una liquidación?</h2>
        <p>Al terminar cualquier contrato laboral te deben pagar: <strong>cesantías</strong> del periodo no consignado, <strong>intereses de cesantías</strong> (12% anual proporcional), <strong>prima</strong> del semestre en curso y <strong>vacaciones</strong> acumuladas (15 días hábiles por año). Si el despido fue sin justa causa, se suma la indemnización según tu tipo de contrato y antigüedad — esta calculadora no la incluye.</p>
        <p>Para entender cada rubro: {" "}
          <Link href="/blog/cesantias-que-son-y-cuando-se-pagan" style={{ color: "var(--fg)" }}>qué son las cesantías</Link> y {" "}
          <Link href="/blog/cuando-pagan-la-prima-y-como-se-calcula" style={{ color: "var(--fg)" }}>cómo se calcula la prima</Link>.</p>
      </div>
    </>
  );
}
