import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { posts, getPost, sources, howtos, AUTHOR, SITE_URL } from "@/content/posts";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      siteName: "Finance",
      locale: "es_CO",
      type: "article",
      publishedTime: post.date,
      images: [{ url: `${SITE_URL}/blog/og/${post.slug}`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [`${SITE_URL}/blog/og/${post.slug}`],
    },
  };
}

const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const related = posts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);
  const others = related.length
    ? related
    : posts.filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      datePublished: post.date,
      dateModified: post.date,
      inLanguage: "es-CO",
      mainEntityOfPage: url,
      author: { "@type": "Person", name: AUTHOR.name, jobTitle: AUTHOR.role },
      publisher: { "@type": "Organization", name: "Finance", url: SITE_URL },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    ...(howtos[post.slug]
      ? [
          {
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: howtos[post.slug].name,
            step: howtos[post.slug].steps.map((s, i) => ({
              "@type": "HowToStep",
              position: i + 1,
              text: s,
            })),
          },
        ]
      : []),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
        { "@type": "ListItem", position: 2, name: post.title, item: url },
      ],
    },
  ];

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-xs mt-2 mb-6" style={{ color: "var(--muted)" }}>
        <Link href="/blog" className="no-underline" style={{ color: "var(--muted)" }}>← Blog</Link>
      </nav>
      <div className="text-[11px] uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
        {post.category} · {fmtDate(post.date)} · {post.minutes} min de lectura
      </div>
      <h1
        className="font-serif font-light text-3xl md:text-[42px] leading-tight mb-6"
        style={{ color: "var(--fg)", letterSpacing: "-0.03em" }}
      >
        {post.title}
      </h1>
      <div className="post-body" dangerouslySetInnerHTML={{ __html: post.html }} />

      <div className="mt-8 flex items-center gap-3 flex-wrap">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`${post.title} 👇\n${url}`)}`}
          target="_blank"
          rel="noopener"
          className="no-underline inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
          style={{ background: "#1faa53", color: "#ffffff" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.7-1.3 1.3-1.9 1.4-.5.1-1.1.2-3.6-.8-3-1.2-4.9-4.3-5.1-4.5-.1-.2-1.2-1.6-1.2-3.1s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.5.6c-.2.2-.3.4-.1.7.2.3.8 1.4 1.8 2.2 1.2 1.1 2.3 1.4 2.6 1.6.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2.1 1c.3.2.5.3.6.4.1.2.1.7-.1 1.4z" />
          </svg>
          Compartir por WhatsApp
        </a>
        <span className="text-xs" style={{ color: "var(--dim)" }}>Ayuda a alguien que se esté haciendo esta pregunta</span>
      </div>

      <div className="mt-10 flex items-center gap-3 rounded-2xl border p-5" style={{ borderColor: "var(--line)", background: "var(--panel)" }}>
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center font-serif text-lg shrink-0"
          style={{ background: "var(--panel2)", color: "var(--fg)" }}
        >
          {AUTHOR.name.charAt(0)}
        </div>
        <div>
          <div className="text-[14.5px] font-medium" style={{ color: "var(--fg)" }}>{AUTHOR.name}</div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            {AUTHOR.role} · Actualizado el {fmtDate(post.date)}
          </div>
        </div>
      </div>

      {sources[post.slug] && (
        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-widest mb-3" style={{ color: "var(--muted)" }}>Fuentes</h2>
          <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
            {sources[post.slug].map((s) => (
              <li key={s.url} className="text-[13px]">
                <a href={s.url} target="_blank" rel="noopener" style={{ color: "var(--muted)" }}>{s.name} ↗</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-serif text-2xl mb-2" style={{ color: "var(--fg)", letterSpacing: "-0.02em" }}>
          Preguntas frecuentes
        </h2>
        {post.faqs.map((f) => (
          <details key={f.q} className="faq-item">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>

      <aside
        className="mt-12 rounded-2xl border p-6"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        <div className="font-serif text-xl mb-1.5" style={{ color: "var(--fg)" }}>
          Deja de hacer cuentas en la cabeza
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
          Finance registra tus gastos, presupuestos, deudas y hasta las ventas de tu negocio — gratis y en segundos.
        </p>
        <Link
          href="/login"
          className="no-underline inline-block rounded-full px-5 py-2 text-sm font-medium"
          style={{ background: "var(--fg)", color: "var(--bg)" }}
        >
          Comenzar gratis
        </Link>
      </aside>

      <section className="mt-12">
        <h2 className="text-[11px] uppercase tracking-widest mb-4" style={{ color: "var(--muted)" }}>
          Sigue leyendo
        </h2>
        <div className="flex flex-col gap-3">
          {others.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="no-underline text-[15px] font-serif"
              style={{ color: "var(--fg)" }}
            >
              {p.title} →
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
