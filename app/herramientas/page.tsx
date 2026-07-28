import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";
import { AÑO } from "./valores";

export const metadata: Metadata = {
  title: "Herramientas financieras gratis para Colombia",
  description:
    `Calculadoras gratuitas ${AÑO}: prima de servicios, liquidación laboral y más. En pesos colombianos y con las fórmulas legales vigentes.`,
  alternates: { canonical: `${SITE_URL}/herramientas` },
};

const tools = [
  {
    href: "/herramientas/fecha-declaracion-renta",
    name: `¿Cuándo me toca declarar renta?`,
    desc: "Tu fecha límite exacta del calendario DIAN, según tu cédula.",
  },
  {
    href: "/herramientas/calculadora-liquidacion",
    name: `Calculadora de liquidación laboral`,
    desc: "Cesantías, intereses, prima y vacaciones al terminar tu contrato.",
  },
  {
    href: "/herramientas/calculadora-prima",
    name: `Calculadora de prima de servicios`,
    desc: "Cuánto te deben pagar de prima en junio y diciembre.",
  },
  {
    href: "/herramientas/calculadora-cesantias",
    name: `Calculadora de cesantías`,
    desc: "Cuánto te consignan al fondo y cuánto recibes de intereses.",
  },
  {
    href: "/herramientas/calculadora-interes-compuesto",
    name: `Calculadora de interés compuesto`,
    desc: "Cuánto crece tu ahorro con aportes mensuales, año tras año.",
  },
];

export default function Page() {
  return (
    <>
      <h1 className="font-serif font-light text-3xl md:text-5xl leading-tight mt-6 mb-3" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
        Herramientas financieras
      </h1>
      <p className="text-[15px] mb-10 max-w-xl" style={{ color: "var(--muted)" }}>
        Calculadoras gratuitas con las fórmulas legales vigentes en {AÑO}, en pesos colombianos.
      </p>
      <div className="flex flex-col gap-4">
        {tools.map((t) => (
          <Link key={t.href} href={t.href} className="no-underline rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <div className="font-serif text-xl md:text-2xl mb-1.5" style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}>{t.name}</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>{t.desc}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
