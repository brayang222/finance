import Link from "next/link";
import type { Metadata } from "next";
import { posts, SITE_URL } from "@/content/posts";

export const metadata: Metadata = {
  title: "Blog de finanzas personales para Colombia",
  description:
    "Respuestas claras a las preguntas financieras que más se hacen los colombianos: salario mínimo, declaración de renta, Datacrédito, CDTs, ahorro y más.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
    types: { "application/rss+xml": `${SITE_URL}/blog/feed.xml` },
  },
  openGraph: {
    title: "Blog de finanzas personales para Colombia | Finance",
    description: "Respuestas claras a las preguntas financieras que más se hacen los colombianos.",
    url: `${SITE_URL}/blog`,
    siteName: "Finance",
    locale: "es_CO",
    type: "website",
  },
};

const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

export default function BlogIndex() {
  const sorted = [...posts].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Blog de Finance",
            url: `${SITE_URL}/blog`,
            description: "Respuestas a las preguntas financieras más frecuentes de los colombianos.",
            inLanguage: "es-CO",
            blogPost: sorted.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `${SITE_URL}/blog/${p.slug}`,
              datePublished: p.date,
            })),
          }),
        }}
      />
      <h1
        className="font-serif font-light text-3xl md:text-5xl leading-tight mt-6 mb-3"
        style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}
      >
        Las preguntas de plata que todos nos hacemos
      </h1>
      <p className="text-[15px] mb-10 max-w-xl" style={{ color: "var(--muted)" }}>
        Respuestas claras y en pesos colombianos a lo que más buscamos sobre finanzas: sueldo, impuestos,
        deudas, ahorro e inversión. Sin jerga, con cifras vigentes.
      </p>
      <div className="flex flex-col gap-4">
        {sorted.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="no-underline rounded-2xl border p-5 transition-colors"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <div className="text-[11px] uppercase tracking-widest mb-1.5" style={{ color: "var(--muted)" }}>
              {p.category} · {fmtDate(p.date)} · {p.minutes} min
            </div>
            <div className="font-serif text-xl md:text-2xl leading-snug mb-1.5" style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}>
              {p.title}
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>{p.description}</div>
          </Link>
        ))}
      </div>
    </>
  );
}
