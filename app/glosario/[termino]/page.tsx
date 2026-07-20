import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { terms, getTerm } from "@/content/glosario";
import { getPost, SITE_URL } from "@/content/posts";

type Props = { params: Promise<{ termino: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return terms.map((t) => ({ termino: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { termino } = await params;
  const t = getTerm(termino);
  if (!t) return {};
  return {
    title: `¿Qué es ${t.term}? — Glosario financiero`,
    description: t.def.split(". ").slice(0, 2).join(". ") + ".",
    alternates: { canonical: `${SITE_URL}/glosario/${t.slug}` },
  };
}

export default async function Page({ params }: Props) {
  const { termino } = await params;
  const t = getTerm(termino);
  if (!t) notFound();

  const post = t.post ? getPost(t.post) : undefined;
  const idx = terms.findIndex((x) => x.slug === t.slug);
  const siblings = [terms[(idx + 1) % terms.length], terms[(idx + 2) % terms.length], terms[(idx + 3) % terms.length]];

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: t.term,
            description: t.def,
            url: `${SITE_URL}/glosario/${t.slug}`,
            inDefinedTermSet: `${SITE_URL}/glosario`,
            inLanguage: "es-CO",
          }),
        }}
      />
      <nav className="text-xs mt-2 mb-6" style={{ color: "var(--muted)" }}>
        <Link href="/glosario" className="no-underline" style={{ color: "var(--muted)" }}>← Glosario</Link>
      </nav>
      <h1 className="font-serif font-light text-3xl md:text-[42px] leading-tight mb-6" style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}>
        {t.term}
      </h1>
      <p className="text-[16px] leading-[1.8] max-w-2xl" style={{ color: "var(--muted)" }}>{t.def}</p>

      {post && (
        <Link
          href={`/blog/${post.slug}`}
          className="no-underline mt-8 rounded-2xl border p-5 flex flex-col gap-1"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span className="text-[11px] uppercase tracking-widest" style={{ color: "var(--muted)" }}>Guía completa</span>
          <span className="font-serif text-xl" style={{ color: "var(--fg)" }}>{post.title} →</span>
        </Link>
      )}

      <section className="mt-10">
        <h2 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Otros términos</h2>
        <div className="flex flex-wrap gap-2">
          {siblings.map((s) => (
            <Link key={s.slug} href={`/glosario/${s.slug}`} className="no-underline rounded-full border px-4 py-1.5 text-[13px]" style={{ borderColor: "var(--line)", color: "var(--fg)" }}>
              {s.term}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
