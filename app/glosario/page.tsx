import type { Metadata } from "next";
import Link from "next/link";
import { terms } from "@/content/glosario";
import { SITE_URL } from "@/content/posts";

export const metadata: Metadata = {
  title: "Glosario financiero colombiano — términos explicados en simple",
  description:
    "UVT, CDT, 4x1000, Bre-B, cesantías, tasa de usura y más de 40 términos financieros de Colombia explicados sin jerga.",
  alternates: { canonical: `${SITE_URL}/glosario` },
};

export default function Page() {
  const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term, "es"));
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "Glosario financiero colombiano",
            url: `${SITE_URL}/glosario`,
            inLanguage: "es-CO",
            hasDefinedTerm: sorted.map((t) => ({
              "@type": "DefinedTerm",
              name: t.term,
              url: `${SITE_URL}/glosario/${t.slug}`,
            })),
          }),
        }}
      />
      <h1 className="font-serif font-light text-3xl md:text-5xl leading-tight mt-6 mb-3" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
        Glosario financiero
      </h1>
      <p className="text-[15px] mb-10 max-w-xl" style={{ color: "var(--muted)" }}>
        Los términos que aparecen en tu extracto, en las noticias y en la DIAN — explicados en simple
        y con contexto colombiano.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {sorted.map((t) => (
          <Link key={t.slug} href={`/glosario/${t.slug}`} className="no-underline rounded-xl border p-4" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
            <div className="text-[15px] font-medium mb-1" style={{ color: "var(--fg)" }}>{t.term}</div>
            <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--muted)" }}>
              {t.def.split(". ")[0]}.
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
