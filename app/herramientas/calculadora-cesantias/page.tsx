import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";
import { AÑO } from "../valores";
import CalcCesantias from "./CalcCesantias";

export const metadata: Metadata = {
  title: `Calculadora de cesantías e intereses ${AÑO} (Colombia)`,
  description:
    "Calcula cuánto te deben consignar de cesantías y cuánto recibes de intereses del 12%: salario, días trabajados y auxilio de transporte incluido.",
  keywords: ["calculadora cesantías", "calcular cesantías", "intereses de cesantías", `cesantías ${AÑO}`],
  alternates: { canonical: `${SITE_URL}/herramientas/calculadora-cesantias` },
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
            name: `Calculadora de cesantías ${AÑO}`,
            url: `${SITE_URL}/herramientas/calculadora-cesantias`,
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
        Calculadora de cesantías {AÑO}
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        Cuánto deben consignarte al fondo y cuánto te llega directo de intereses, con auxilio
        de transporte incluido si aplica.
      </p>
      <CalcCesantias />
      <div className="post-body mt-10">
        <h2>Las dos fechas que importan</h2>
        <p><strong>31 de enero:</strong> tu empleador te paga directamente los intereses (12% anual sobre el saldo). <strong>14 de febrero:</strong> fecha límite para consignar las cesantías del año anterior en tu fondo. Si no consignan a tiempo, deben pagarte un día de salario por cada día de retraso.</p>
        <p>Cuándo puedes retirarlas y si conviene hacerlo:{" "}
        <Link href="/blog/cesantias-que-son-y-cuando-se-pagan" style={{ color: "var(--fg)" }}>¿Qué son las cesantías y cuándo se pagan?</Link></p>
      </div>
    </>
  );
}
