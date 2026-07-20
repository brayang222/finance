import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";
import { AÑO, SMMLV, AUX_TRANSPORTE, fmtCOP } from "../valores";
import CalcPrima from "./CalcPrima";

export const metadata: Metadata = {
  title: `Calculadora de prima de servicios ${AÑO} (Colombia)`,
  description: `Calcula cuánto te deben pagar de prima en ${AÑO}: ingresa tu salario y días trabajados. Incluye auxilio de transporte y la fórmula legal explicada.`,
  keywords: ["calculadora prima", "calcular prima de servicios", `prima ${AÑO}`, "cuánto me pagan de prima"],
  alternates: { canonical: `${SITE_URL}/herramientas/calculadora-prima` },
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
            name: `Calculadora de prima de servicios ${AÑO}`,
            url: `${SITE_URL}/herramientas/calculadora-prima`,
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
        Calculadora de prima de servicios {AÑO}
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        Ingresa tu salario y los días trabajados del semestre. Si ganas hasta dos salarios mínimos
        ({fmtCOP(2 * SMMLV)}), sumamos automáticamente el auxilio de transporte ({fmtCOP(AUX_TRANSPORTE)}).
      </p>
      <CalcPrima />
      <div className="post-body mt-10">
        <h2>¿Cómo se calcula la prima?</h2>
        <p><strong>Prima = (salario mensual + auxilio de transporte) × días trabajados del semestre ÷ 360.</strong> Se paga en dos partes: a más tardar el 30 de junio y en los primeros 20 días de diciembre. Todo empleado con contrato laboral tiene derecho, proporcional al tiempo trabajado.</p>
        <p>¿Dudas sobre fechas, salario variable o contrato por prestación de servicios? Lee la guía completa:
        {" "}<Link href="/blog/cuando-pagan-la-prima-y-como-se-calcula" style={{ color: "var(--fg)" }}>¿Cuándo pagan la prima y cómo se calcula?</Link></p>
      </div>
    </>
  );
}
