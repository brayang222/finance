import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";

export const metadata: Metadata = {
  title: "Valor de la UVT: histórico 2016-2026",
  description:
    "Tabla del valor de la UVT en Colombia año a año (2016-2026) y para qué sirve: topes de renta, sanciones DIAN y exención del 4x1000.",
  keywords: ["uvt histórica", "valor uvt por año", "uvt 2026", "historial uvt colombia"],
  alternates: { canonical: `${SITE_URL}/datos/uvt-historica` },
};

const data: [number, number][] = [
  [2026, 52_374],
  [2025, 49_799],
  [2024, 47_065],
  [2023, 42_412],
  [2022, 38_004],
  [2021, 36_308],
  [2020, 35_607],
  [2019, 34_270],
  [2018, 33_156],
  [2017, 31_859],
  [2016, 29_753],
];

const f = (n: number) => "$" + n.toLocaleString("es-CO");

export default function Page() {
  return (
    <>
      <h1 className="font-serif font-light text-3xl md:text-5xl leading-tight mt-6 mb-3" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
        Valor de la UVT, año a año
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        La Unidad de Valor Tributario define topes de renta, sanciones de la DIAN y la exención
        del 4x1000. Este es su valor en los últimos 11 años.
      </p>
      <div className="post-body">
        <table>
          <thead><tr><th>Año</th><th>Valor UVT</th><th>1.400 UVT (tope de renta)</th></tr></thead>
          <tbody>
            {data.map(([año, uvt]) => (
              <tr key={año}>
                <td style={{ color: "var(--fg)", fontWeight: 600 }}>{año}</td>
                <td>{f(uvt)}</td>
                <td>{f(uvt * 1400)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>La UVT se ajusta cada año con la inflación (certificada por la DIAN en diciembre). La tercera columna muestra el tope de ingresos de 1.400 UVT que suele definir quién declara renta.</p>
        <p>Guías relacionadas:{" "}
        <Link href="/blog/quienes-deben-declarar-renta-en-2026" style={{ color: "var(--fg)" }}>¿Quién debe declarar renta en 2026?</Link>
        {" "}· <Link href="/blog/que-es-el-4x1000-y-como-evitarlo" style={{ color: "var(--fg)" }}>El 4x1000 y cómo evitarlo</Link>
        {" "}· <Link href="/glosario/uvt" style={{ color: "var(--fg)" }}>¿Qué es la UVT?</Link></p>
      </div>
    </>
  );
}
