import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/content/posts";

export const metadata: Metadata = {
  title: "Descarga Finance — app de finanzas para Android y web",
  description:
    "Registra gastos, presupuestos, deudas y las ventas de tu negocio desde el celular. Descarga el APK para Android o usa la versión web gratis.",
  keywords: ["app finanzas colombia", "app control de gastos", "descargar finance apk", "app para negocio ventas"],
  alternates: { canonical: `${SITE_URL}/app` },
};

const features = [
  ["Personal", "Gastos, presupuestos por categoría, deudas, metas, inversiones y cripto en un solo lugar."],
  ["Negocio", "Vende con POS, controla inventario, fiado de clientes, proveedores y cierre de caja."],
  ["Privada", "Bloqueo biométrico, cifrado de tus notas y modo privacidad para mirar tu plata en público."],
  ["Sin fricción", "Registra un gasto en segundos, incluso sin conexión. Tus datos se sincronizan con la web."],
] as const;

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Finance",
            operatingSystem: "Android, Web",
            applicationCategory: "FinanceApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "COP" },
            url: `${SITE_URL}/app`,
            downloadUrl: `${SITE_URL}/finance.apk`,
            inLanguage: "es-CO",
          }),
        }}
      />
      <h1 className="font-serif font-light text-3xl md:text-5xl leading-tight mt-6 mb-3" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
        Tus finanzas en el bolsillo
      </h1>
      <p className="text-[15px] mb-8 max-w-xl" style={{ color: "var(--muted)" }}>
        La misma app que en la web, hecha para el día a día: registra en segundos, mira tu mes
        de un vistazo y lleva tu negocio en la misma cuenta.
      </p>
      <div className="flex gap-3 flex-wrap mb-12">
        <a
          href="/finance.apk"
          className="no-underline rounded-full px-6 py-3 text-sm font-medium"
          style={{ background: "var(--fg)", color: "var(--bg)" }}
        >
          Descargar APK (Android)
        </a>
        <Link
          href="/login"
          className="no-underline rounded-full px-6 py-3 text-sm font-medium border"
          style={{ borderColor: "var(--line)", color: "var(--fg)" }}
        >
          Usar en la web
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {features.map(([title, desc]) => (
          <div key={title} className="rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <div className="text-[15px] font-medium mb-1.5" style={{ color: "var(--fg)" }}>{title}</div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-10 rounded-2xl border p-6" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
        <div className="text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>
          Lo que no vas a encontrar aquí
        </div>
        <ul className="m-0 p-0 list-none flex flex-col gap-2 text-sm" style={{ color: "var(--muted)" }}>
          <li><strong style={{ color: "var(--fg)" }}>Anuncios</strong> — tu información financiera no es una valla publicitaria.</li>
          <li><strong style={{ color: "var(--fg)" }}>Datos secuestrados</strong> — exporta tus movimientos, ventas y fiado a CSV cuando quieras.</li>
          <li><strong style={{ color: "var(--fg)" }}>Pánico al cambiar de celular</strong> — todo vive en tu cuenta, no en el teléfono.</li>
          <li><strong style={{ color: "var(--fg)" }}>Dependencia total del internet</strong> — consulta tus datos sin señal, y las ventas del negocio se guardan y envían solas al reconectar.</li>
        </ul>
      </div>
      <p className="text-xs mt-8" style={{ color: "var(--muted)" }}>
        Para instalar el APK, permite "instalar apps de origen desconocido" en tu Android.
        Versión iOS: usa la web desde Safari y agrégala a tu pantalla de inicio.
      </p>
    </>
  );
}
