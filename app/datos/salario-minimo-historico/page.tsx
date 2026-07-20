import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";

export const metadata: Metadata = {
  title: "Salario mínimo en Colombia: histórico 2016-2026",
  description:
    "Tabla del salario mínimo y auxilio de transporte en Colombia año a año (2016-2026), con el porcentaje de aumento de cada año.",
  keywords: ["salario mínimo histórico colombia", "historial salario mínimo", "aumento salario mínimo por año"],
  alternates: { canonical: `${SITE_URL}/datos/salario-minimo-historico` },
};

// [año, SMMLV, auxilio, % aumento del SMMLV]
const data: [number, number, number, string][] = [
  [2026, 1_750_905, 249_095, "23,0%"],
  [2025, 1_423_500, 200_000, "9,5%"],
  [2024, 1_300_000, 162_000, "12,1%"],
  [2023, 1_160_000, 140_606, "16,0%"],
  [2022, 1_000_000, 117_172, "10,1%"],
  [2021, 908_526, 106_454, "3,5%"],
  [2020, 877_803, 102_854, "6,0%"],
  [2019, 828_116, 97_032, "6,0%"],
  [2018, 781_242, 88_211, "5,9%"],
  [2017, 737_717, 83_140, "7,0%"],
  [2016, 689_455, 77_700, "7,0%"],
];

const f = (n: number) => "$" + n.toLocaleString("es-CO");

export default function Page() {
  return (
    <>
      <h1 className="font-serif font-light text-3xl md:text-5xl leading-tight mt-6 mb-3" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
        Salario mínimo en Colombia, año a año
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        Histórico del salario mínimo mensual y el auxilio de transporte de los últimos 11 años,
        con el aumento porcentual decretado cada año.
      </p>
      <div className="post-body">
        <table>
          <thead><tr><th>Año</th><th>Salario mínimo</th><th>Auxilio de transporte</th><th>Aumento</th></tr></thead>
          <tbody>
            {data.map(([año, smmlv, aux, pct]) => (
              <tr key={año}>
                <td style={{ color: "var(--fg)", fontWeight: 600 }}>{año}</td>
                <td>{f(smmlv)}</td>
                <td>{f(aux)}</td>
                <td>{pct}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>El aumento de 2026 (23%) es el mayor de la década: el mínimo con auxilio llegó a $2.000.000 exactos. En 10 años el salario mínimo se multiplicó por 2,5, mientras el auxilio de transporte se multiplicó por 3,2.</p>
        <p>Qué significa el valor vigente para tu bolsillo:{" "}
        <Link href="/blog/cuanto-es-el-salario-minimo-2026-en-colombia" style={{ color: "var(--fg)" }}>¿Cuánto es el salario mínimo en 2026?</Link>
        {" "}· También puedes ver la <Link href="/datos/uvt-historica" style={{ color: "var(--fg)" }}>UVT histórica</Link>.</p>
      </div>
    </>
  );
}
